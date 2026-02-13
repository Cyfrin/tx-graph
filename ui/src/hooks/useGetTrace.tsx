import { useState, useEffect } from "react"
import { ethers } from "ethers"
import * as TxTypes from "../types/tx"
import * as api from "../api"
import * as TracerTypes from "../components/tracer/types"
import * as GraphTypes from "../components/graph/lib/types"
import * as graph from "../components/graph/lib/graph"
import * as foundry from "../foundry"
import { zip, assert, sleep } from "../utils"
import * as EvmTypes from "../components/ctx/evm/types"

export type ObjType = "acc" | "fn"

// Final data to output
export type Data = {
  objs: Map<
    GraphTypes.Id,
    GraphTypes.Obj<ObjType, EvmTypes.Account | TracerTypes.FnDef>
  >
  groups: GraphTypes.Groups
  calls: GraphTypes.Call<EvmTypes.Evm, TracerTypes.FnCall>[]
  trace: TracerTypes.Trace<EvmTypes.Evm>
  graph: GraphTypes.Graph
  labels: Record<string, string>
  addrs: Set<string>
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
  try {
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
  } catch (error) {
    console.log("Parse fn error", error)
    return null
  }
}

function build(root: TxTypes.TxCall, contracts: TxTypes.ContractInfo[]): Data {
  const cons: { [key: string]: TxTypes.ContractInfo[] } = contracts.reduce(
    (z, c) => {
      // @ts-ignore
      z[c.address] = c
      return z
    },
    {},
  )

  // Account or function to Id
  const ids: Map<string, GraphTypes.Id> = new Map()
  const objs: Map<
    GraphTypes.Id,
    GraphTypes.Obj<ObjType, EvmTypes.Account | TracerTypes.FnDef>
  > = new Map()
  const groups: GraphTypes.Groups = new Map()
  const calls: GraphTypes.Call<EvmTypes.Evm, TracerTypes.FnCall>[] = []
  const stack: TracerTypes.Trace<EvmTypes.Evm>[] = []

  // Put initial caller into it's own group
  groups.set(0, new Set())

  const addrs = new Set<string>()

  graph.dfs<TxTypes.TxCall>(
    root,
    (c) => c?.calls || [],
    (i, d, c) => {
      addrs.add(c.from)
      addrs.add(c.to)

      for (const addr of [c.from, c.to]) {
        const key = `addr:${addr}`
        if (!ids.has(key)) {
          ids.set(key, ids.size)
          const id = ids.get(key) as GraphTypes.Id
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
      const fnId = ids.get(fnKey) as GraphTypes.Id

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

      const toId = ids.get(`addr:${c.to}`) as GraphTypes.Id
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

  // Count duplicates
  const count: Record<string, number> = {}
  for (const c of contracts) {
    if (c.name) {
      const name = c.name.toLowerCase()
      if (!count[name]) {
        count[name] = 0
      }
      count[name] += 1
    }
  }

  const labels: Record<string, string> = {}
  for (const c of contracts) {
    if (c.name) {
      if (count[c.name.toLowerCase()] == 1) {
        labels[c.address] = c.name
      }
    }
  }

  return {
    objs,
    trace: stack[0],
    groups,
    calls,
    graph: graph.build(calls),
    labels,
    addrs,
  }
}

export type State = {
  trace: {
    running: boolean
    error: any
    data: TxTypes.TxCall | null
  }
  q: {
    total: number
    fetched: number
    contracts: TxTypes.ContractInfo[]
    running: boolean
  }
  data: Data | null
}

export function useGetTrace(params: { txHash: string; chain: string }) {
  const STATE: State = {
    trace: {
      running: false,
      error: null,
      data: null,
    },
    q: {
      total: 0,
      fetched: 0,
      contracts: [],
      running: false,
    },
    data: null,
  }

  const [state, setState] = useState<State>(STATE)

  useEffect(() => {
    let stop = false

    // Get trace
    const get = async () => {
      setState((state) => ({
        ...state,
        trace: {
          running: true,
          data: null,
          error: null,
        },
      }))

      try {
        if (params.chain == "foundry-test") {
          const res = foundry.getTrace()
          assert(!!res, "Foundry trace is null")
          setState((state) => ({
            ...state,
            trace: {
              running: false,
              data: res,
              error: null,
            },
          }))
          return { data: res }
        } else {
          const res = await api.getTxTrace(params.chain, params.txHash)
          assert(!!res?.result, "Get trace returned null")
          setState((state) => ({
            ...state,
            trace: {
              running: false,
              data: res?.result,
              error: null,
            },
          }))
          return { data: res?.result }
        }
      } catch (error) {
        setState((state) => ({
          ...state,
          trace: {
            running: false,
            error,
            data: null,
          },
        }))
        return { error }
      }
    }

    // Get trace, contract info, combine results
    const f = async () => {
      const { data } = await get()
      if (!data) {
        return
      }

      // Collect contract addresses
      const txCalls: [number, TxTypes.TxCall][] = []
      graph.dfs<TxTypes.TxCall>(
        data,
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

      try {
        if (params.chain == "foundry-test") {
          const contracts: TxTypes.ContractInfo[] = foundry.getContracts([
            ...addrs.values(),
          ])

          setState((state) => ({
            ...state,
            q: {
              total: contracts.length,
              fetched: contracts.length,
              contracts,
              running: false,
            },
            data: build(data, contracts),
          }))
        } else {
          setState((state) => ({
            ...state,
            q: {
              total: addrs.size,
              fetched: 0,
              contracts: [],
              running: true,
            },
            data: build(data, []),
          }))

          const { job_ids, contracts } = await api.postJobs({
            chain: params.chain,
            addrs: [...addrs.values()],
          })

          const b = build(data, contracts)

          setState((state) => ({
            ...state,
            q: {
              total: addrs.size,
              fetched: contracts.length,
              contracts,
              running: job_ids.length > 0,
            },
            data: b,
          }))

          if (job_ids.length == 0) {
            stop = true
          } else {
            const poll = async () => {
              while (!stop) {
                try {
                  const res = await api.getJobs({ job_ids })

                  stop =
                    Object.values(res).filter((v) => v?.status == "complete")
                      .length == job_ids.length

                  const newContracts: TxTypes.ContractInfo[] = Object.values(
                    res,
                  )
                    .map((v) => v?.contract)
                    .filter((c) => !!c)

                  const set: Record<string, TxTypes.ContractInfo> = {}
                  for (const c of [...contracts, ...newContracts]) {
                    set[c.address] = c
                  }
                  const all = Object.values(set)

                  const b = build(data, all)

                  setState((state) => ({
                    ...state,
                    q: {
                      total: addrs.size,
                      fetched: all.length,
                      contracts: all,
                      running: !stop,
                    },
                    data: b,
                  }))
                } catch (error) {
                  console.log("Polling error", error)
                }
                if (!stop) {
                  await sleep(1000)
                }
              }
            }

            poll()
          }
        }
      } catch (error) {
        console.log("Build trace error:", error)
      }
    }

    if (params.txHash && params.chain) {
      f()
    }

    return () => {
      stop = true
    }
  }, [params.txHash, params.chain])

  return {
    state,
  }
}
