import { ethers } from "ethers"
import { RPC_CONFIG } from "./config"
import { TxCall, ContractInfo, AbiEntry } from "./types/tx"
import { File } from "./types/file"
import * as api from "./api"
import { Id, Call, Groups } from "./components/canvas/lib/types"
import { Trace, Input, Output, FnCall, FnDef } from "./components/tracer/types"
import * as graph from "./components/canvas/lib/graph"
import * as foundry from "./foundry"
import { zip, assert } from "./utils"
import { Account, Evm } from "./components/ctx/evm/types"

// TODO: move to graph/lib/types?
export type ObjType = "acc" | "fn"
export type Obj<T, V> = {
  id: Id
  type: T
  val: V
}

// TODO: store into objects?
export type Arrow<V> = {
  src: Id
  dst: Id
  val: V
}

function parse(
  abi: AbiEntry[] | null,
  input: string,
  output?: string,
): {
  name?: string
  selector?: string
  inputs?: Input[]
  outputs?: Output[]
} | null {
  if (!abi) {
    return null
  }

  const iface = new ethers.Interface(abi)
  const tx = iface.parseTransaction({ data: input })
  if (!tx) {
    return null
  }

  const fn = {
    name: tx.name,
    selector: tx.selector,
    inputs: [],
    outputs: [],
  }

  // @ts-ignore
  if (tx?.fragment) {
    const vals = iface.decodeFunctionData(tx.fragment, input)
    // @ts-ignore
    fn.inputs = zip(vals, [...tx.fragment.inputs], (v, t) => {
      return {
        type: t.type,
        name: t.name,
        val: v,
      }
    })
  }
  if (tx?.fragment && output) {
    // @ts-ignore
    const vals = iface.decodeFunctionResult(tx.fragment, output)
    // @ts-ignore
    fn.outputs = zip(vals, [...tx.fragment.outputs], (v, t) => {
      return {
        type: t.type,
        name: t.name,
        val: v,
      }
    })
  }
  return fn
}

export function build(
  root: TxCall,
  contracts: ContractInfo[],
): {
  objs: Map<Id, Obj<ObjType, Account | FnDef>>
  arrows: Arrow<FnCall>[]
  groups: Groups
  calls: Call<Evm, FnCall>[]
  trace: Trace<Evm>
} {
  const cons: { [key: string]: ContractInfo[] } = contracts.reduce((z, c) => {
    // @ts-ignore
    z[c.address] = c
    return z
  }, {})

  // Account or function to Id
  const ids: Map<string, Id> = new Map()
  const objs: Map<Id, Obj<ObjType, Account | FnDef>> = new Map()
  const arrows: Arrow<FnCall>[] = []
  const groups: Groups = new Map()
  const calls: Call<Evm, FnCall>[] = []
  const stack: Trace<Evm>[] = []

  // Put initial caller into it's own group
  groups.set(0, new Set())

  graph.dfs<TxCall>(
    root,
    (c) => c?.calls || [],
    (i, d, c) => {
      for (const addr of [c.from, c.to]) {
        const key = `addr:${addr}`
        if (!ids.has(key)) {
          ids.set(key, ids.size)
          const id = ids.get(key) as Id
          objs.set(id, {
            id: id,
            type: "acc",
            val: {
              // @ts-ignore
              name: cons[addr]?.name,
              addr,
              fns: new Map(),
            },
          })
        }
      }

      // @ts-ignore
      const fn = parse(cons[c.to]?.abi, c.input, c.output)

      const fnKey = `fn:${c.to}.${fn?.selector}`
      if (!ids.has(fnKey)) {
        ids.set(fnKey, ids.size)
      }
      const fnId = ids.get(fnKey) as Id

      const trace: Trace<Evm> = {
        i,
        depth: d,
        fn: {
          id: fnId,
          // @ts-ignore
          mod: cons[c.to]?.name || c.to,
          name: fn?.name || "",
          inputs: fn?.inputs || [],
          outputs: fn?.outputs || [],
        },
        ctx: {
          // @ts-ignore
          name: cons[c.to]?.name,
          src: c.from,
          dst: c.to,
          val: BigInt(c.value || 0),
          type: c.type.toLowerCase(),
          raw: {
            input: c.input,
            output: c.output,
          },
          selector: fn?.selector,
          gas: BigInt(c.gasUsed),
        },
        calls: [],
      }

      // Objects
      if (!objs.has(trace.fn.id)) {
        objs.set(trace.fn.id, {
          id: trace.fn.id,
          type: "fn",
          val: {
            id: trace.fn.id,
            mod: trace.fn.mod,
            name: trace.fn.name,
            inputs: trace.fn.inputs.map(({ name, type }) => ({ name, type })),
            outputs: trace.fn.outputs.map(({ name, type }) => ({ name, type })),
          },
        })
      }

      // Stack
      while (stack.length >= d + 1) {
        stack.pop()
      }
      const parent = stack[stack.length - 1]
      if (parent) {
        parent.calls.push(trace)
      }
      stack.push(trace)

      if (parent) {
        arrows.push({
          src: parent.fn.id,
          dst: trace.fn.id,
          val: trace.fn,
        })
      }

      const toId = ids.get(`addr:${c.to}`) as Id
      // @ts-ignore
      const acc = objs.get(toId).val as Account
      if (!acc.fns.has(trace.fn.id)) {
        acc.fns.set(trace.fn.id, trace.fn)
      }

      // Groups
      if (!groups.has(toId)) {
        groups.set(toId, new Set())
      }
      // @ts-ignore
      groups.get(toId).add(trace.fn.id)

      // Calls
      // TODO: fix parent
      calls.push({
        // @ts-ignore
        src: parent?.fn.id || 0,
        // @ts-ignore
        dst: trace.fn.id,
        depth: d,
        ctx: trace.ctx,
        fn: trace.fn,
      })
    },
  )

  return {
    objs,
    arrows,
    trace: stack[0],
    groups,
    calls,
  }
}

export async function getTrace(params: {
  txHash: string
  chain: string
  // Get file saved to React context
  get: (key: string) => File[] | null
}) {
  const { txHash, chain } = params

  let t: { result: TxCall } | null = null
  if (chain == "foundry-test") {
    const res = foundry.build(params.get)
    assert(res != null, "Foundry trace is null")
    // @ts-ignore
    t = { result: res }
  } else {
    t = await api.getTxTrace(chain, txHash)
  }

  const txCalls: [number, TxCall][] = []
  graph.dfs<TxCall>(
    // @ts-ignore
    t.result,
    (c) => c?.calls || [],
    (_, d, c) => {
      txCalls.push([d, c])
    },
  )

  const addrs = new Set<string>()
  for (const [_, c] of txCalls) {
    addrs.add(c.from)
    addrs.add(c.to)
  }

  const contracts: ContractInfo[] =
    chain == "foundry-test"
      ? foundry.getContracts([...addrs.values()], params.get)
      : await api.getContracts({
          chain,
          // @ts-ignore
          chain_id: RPC_CONFIG[chain]?.chainId,
          addrs: [...addrs.values()],
        })

  // @ts-ignore
  const { calls, groups, objs, arrows, trace } = build(t.result, contracts)

  return {
    calls,
    groups,
    objs,
    arrows,
    trace,
    graph: graph.build(calls),
  }
}
