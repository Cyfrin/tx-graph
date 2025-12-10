import { Interface, ParamType } from "ethers"
import { TxCall, ContractInfo } from "./types/tx"
import { File } from "./types/file"

type Trace = {
  depth: number
  success: boolean
  caller: string
  address: string
  kind: "CREATE" | "CALL" | "DELEGATECALL" | "STATICCALL"
  value: string
  data: string
  output: string
  gas_limit: number
  gas_used: number
}

type ArenaEntry = {
  trace: Trace
  idx: number
  parent: number | null
  children: number[]
}

type Arena = {
  arena: ArenaEntry[]
}

type LifeCycle = "Deployment" | "Setup" | "Execution"

type Test = {
  traces: [LifeCycle, Arena][]
  // TODO: address to label?
  labeled_addresses?: Record<string, string>
}

// Test contract name => test name => Test
type Tests = Record<string, { test_results: Record<string, Test> }>

const LABELS: Record<string, string> = {
  "0x7109709ecfa91a80626ff3989d68f67f5b1dd12d": "Vm",
  "0x000000000000000000636f6e736f6c652e6c6f67": "Console",
}

function dfs<A>(
  start: A,
  get: (a: A) => A[],
  f: (i: number, d: number, a: A) => void,
) {
  const q: [number, A][] = [[0, start]]

  let i = 0
  while (q.length > 0) {
    const [d, a] = q.pop() as [number, A]

    f(i, d, a)
    i++

    const next = get(a)
    // Reverse
    for (let j = next.length - 1; j >= 0; j--) {
      q.push([d + 1, next[j]])
    }
  }
}

// TODO: rename test?
//  forge test --match-path test/Counter.t.sol -vvvv --json | jq . > out.json

// Build TxCall
// @ts-ignore
export function build(get: (key: string) => File[] | null): TxCall {
  // TODO: clean up
  try {
    // TODO: clean up
    // @ts-ignore
    const tests: Tests = get("trace")?.[0]?.data
    const txCalls: TxCall[] = []

    // TODO: aggregrate deployment + setup + tests
    for (const [testContractName, { test_results }] of Object.entries(tests)) {
      for (const [testName, test] of Object.entries(test_results)) {
        for (const [step, { arena }] of test.traces) {
          switch (step) {
            case "Deployment": {
              break
            }
            case "Setup": {
              break
            }
            case "Execution": {
              const stack: TxCall[] = []
              // Create a nested TxCall
              dfs(
                // TODO: remove ts-ignore
                // @ts-ignore
                arena[0].idx,
                // @ts-ignore
                (a) => arena[a].children,
                (i, d, a) => {
                  const { trace } = arena[a]
                  const call: TxCall = {
                    from: trace.caller,
                    to: trace.address,
                    type: trace.kind,
                    input: trace.data,
                    output: trace.output,
                    gas: trace.gas_limit.toString(),
                    gasUsed: trace.gas_used.toString(),
                    value: trace.value,
                    calls: [],
                  }

                  while (stack.length >= d + 1) {
                    stack.pop()
                  }
                  const parent = stack[stack.length - 1]
                  if (parent?.calls) {
                    parent.calls.push(call)
                  }
                  stack.push(call)
                },
              )
              // TODO: clean up
              // @ts-ignore
              txCalls.push(stack[0])
            }
            default: {
              break
            }
          }
        }
      }
    }

    const txCall: TxCall = {
      from: "foundry test",
      // TODO: clean up
      to: txCalls[0].from,
      type: "CALL",
      input: "",
      output: "",
      gas: "",
      gasUsed: "",
      value: "",
      calls: txCalls,
    }

    return txCall
  } catch (err) {
    console.log("Foundry error:", err)
  }
}

export function getContracts(
  addrs: string[],
  get: (key: string) => File[] | null,
): ContractInfo[] {
  try {
    // TODO: clean up
    // @ts-ignore
    const tests: Tests = get("trace")?.[0]?.data
    const abis = get("abi") || []
    // contract name => ABI
    const files = new Map(abis.map((f) => [f.name, f.data]))
    const addrToAbi = new Map()

    for (const [addr, name] of Object.entries(LABELS)) {
      const abi = files.get(`${name}.json`)
      addrToAbi.set(addr, { name, abi })
    }

    for (const [testContractName, { test_results }] of Object.entries(tests)) {
      for (const [testName, test] of Object.entries(test_results)) {
        if (test.labeled_addresses) {
          for (const [addr, name] of Object.entries(test.labeled_addresses)) {
            const abi = files.get(`${name}.json`)
            addrToAbi.set(addr, { name, abi })
          }
        }

        for (const [step, { arena }] of test.traces) {
          switch (step) {
            case "Deployment": {
              // Test contract address
              const name = testContractName.split(":")[1]
              const addr = arena[0].trace.address
              const abi = files.get(`${name}.json`)
              addrToAbi.set(addr, { name, abi })
              break
            }
            case "Setup": {
              break
            }
            default: {
              break
            }
          }
        }
      }
    }

    return addrs.map((addr) => {
      const val = addrToAbi.get(addr)
      if (val) {
        return {
          chain: "foundry-test",
          address: addr,
          name: val.name,
          abi: val.abi.abi,
        }
      }
      return {
        chain: "foundry-test",
        address: addr,
      }
    })
  } catch (err) {
    console.log("Foundry error:", err)
    return []
  }
}
