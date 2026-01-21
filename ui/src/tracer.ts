import { ethers } from "ethers"
import { RPC_CONFIG } from "./config"
import * as TxTypes from "./types/tx"
import * as FileTypes from "./types/file"
import * as ApiTypes from "./api/types"
import * as api from "./api"
import * as FileStorage from "./files"
import * as TracerTypes from "./components/tracer/types"
import * as CanvasTypes from "./components/canvas/lib/types"
import * as graph from "./components/canvas/lib/graph"
import * as foundry from "./foundry"
import { zip, assert } from "./utils"
import * as EvmTypes from "./components/ctx/evm/types"

// TODO: move to graph/lib/types?
export type ObjType = "acc" | "fn"
export type Obj<T, V> = {
  id: CanvasTypes.Id
  type: T
  val: V
}

// TODO: store into objects?
export type Arrow<V> = {
  src: CanvasTypes.Id
  dst: CanvasTypes.Id
  val: V
}

function parse(
  abi: TxTypes.AbiEntry[] | null,
  input: string,
  output?: string,
): {
  name?: string
  selector?: string
  inputs?: TracerTypes.Input[]
  outputs?: TracerTypes.Output[]
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
  root: TxTypes.TxCall,
  contracts: TxTypes.ContractInfo[],
): {
  objs: Map<CanvasTypes.Id, Obj<ObjType, EvmTypes.Account | TracerTypes.FnDef>>
  arrows: Arrow<TracerTypes.FnCall>[]
  groups: CanvasTypes.Groups
  calls: CanvasTypes.Call<EvmTypes.Evm, TracerTypes.FnCall>[]
  trace: TracerTypes.Trace<EvmTypes.Evm>
} {
  const cons: { [key: string]: TxTypes.ContractInfo[] } = contracts.reduce(
    (z, c) => {
      // @ts-ignore
      z[c.address] = c
      return z
    },
    {},
  )

  // Account or function to Id
  const ids: Map<string, CanvasTypes.Id> = new Map()
  const objs: Map<
    CanvasTypes.Id,
    Obj<ObjType, EvmTypes.Account | TracerTypes.FnDef>
  > = new Map()
  const arrows: Arrow<TracerTypes.FnCall>[] = []
  const groups: CanvasTypes.Groups = new Map()
  const calls: CanvasTypes.Call<EvmTypes.Evm, TracerTypes.FnCall>[] = []
  const stack: TracerTypes.Trace<EvmTypes.Evm>[] = []

  // Put initial caller into it's own group
  groups.set(0, new Set())

  graph.dfs<TxTypes.TxCall>(
    root,
    (c) => c?.calls || [],
    (i, d, c) => {
      for (const addr of [c.from, c.to]) {
        const key = `addr:${addr}`
        if (!ids.has(key)) {
          ids.set(key, ids.size)
          const id = ids.get(key) as CanvasTypes.Id
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
      const fnId = ids.get(fnKey) as CanvasTypes.Id

      const trace: TracerTypes.Trace<EvmTypes.Evm> = {
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
          type: c.type.toLowerCase() as EvmTypes.CallType,
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

      const toId = ids.get(`addr:${c.to}`) as CanvasTypes.Id
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
        i: calls.length,
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

export async function getTrace(params: { txHash: string; chain: string }) {
  const { txHash, chain } = params

  let t: { result: TxTypes.TxCall } | null = null
  if (chain == "foundry-test") {
    const res = foundry.getTrace()
    assert(res != null, "Foundry trace is null")
    // @ts-ignore
    t = { result: res }
  } else {
    t = await api.getTxTrace(chain, txHash)
  }

  assert(!!t?.result, "TX trace is null")

  const txCalls: [number, TxTypes.TxCall][] = []
  graph.dfs<TxTypes.TxCall>(
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

  const contracts: TxTypes.ContractInfo[] =
    chain == "foundry-test"
      ? foundry.getContracts([...addrs.values()])
      : await api.getContracts({
          chain,
          // @ts-ignore
          chain_id: RPC_CONFIG[chain]?.chainId,
          addrs: [...addrs.values()],
        })

  let jobId: string | null = null
  /*
  if (chain != "foundry-test") {
    const { job_id } = await api.postContractsJob({
      chain,
      addrs: [...addrs.values()],
    })
    jobId = job_id
  }
  */

  // @ts-ignore
  const { calls, groups, objs, arrows, trace } = build(t.result, contracts)

  return {
    calls,
    groups,
    objs,
    arrows,
    trace,
    graph: graph.build(calls),
    jobId,
  }
}
