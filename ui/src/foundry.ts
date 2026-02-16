import * as TxTypes from "./types/tx"
import * as FileTypes from "./types/file"

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
  // Address => label
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

//  forge test --match-path test/Counter.t.sol -vvvv --json | jq . > out.json

// TODO: fix - contracts / interfaces not shown on trace and graph

// Build TxCall
export function getTrace(mem: FileTypes.MemStore): TxTypes.TxCall | null {
  // @ts-ignore
  const tests: Tests = mem.get("trace")?.[0]?.data
  if (!tests) {
    return null
  }

  const txCalls: TxTypes.TxCall[] = []

  for (const [testContractName, { test_results }] of Object.entries(tests)) {
    for (const [testName, test] of Object.entries(test_results)) {
      for (const [step, { arena }] of test.traces) {
        if (step == "Setup" || step == "Execution") {
          const stack: TxTypes.TxCall[] = []
          // Create a nested TxCall
          dfs(
            arena[0].idx,
            (a) => arena[a].children,
            (i, d, a) => {
              const { trace } = arena[a]
              const call: TxTypes.TxCall = {
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
          txCalls.push(stack[0])
        }
      }
    }
  }

  const txCall: TxTypes.TxCall = {
    from: "foundry test",
    to: txCalls[0]?.from || "",
    type: "CALL",
    input: "",
    output: "",
    gas: "",
    gasUsed: "",
    value: "",
    calls: txCalls,
  }

  return txCall
}

export function getContracts(
  mem: FileTypes.MemStore,
  addrs: string[],
): TxTypes.ContractInfo[] {
  // @ts-ignore
  const tests: Tests = mem.get("trace")?.[0]?.data
  if (!tests) {
    return []
  }

  const abis = mem.get("abi") || []
  // contract name => ABI
  const files = new Map(abis.map((f) => [f.name, f.data]))
  const addrToAbi = new Map()

  // Map Foundry addresses to ABIs
  for (const [addr, name] of Object.entries(LABELS)) {
    const abi = files.get(`${name}.json`)
    addrToAbi.set(addr, { name, abi })
  }

  // Map addresses to ABIs
  for (const [testContractName, { test_results }] of Object.entries(tests)) {
    for (const [testName, test] of Object.entries(test_results)) {
      if (test.labeled_addresses) {
        for (const [addr, name] of Object.entries(test.labeled_addresses)) {
          const abi = files.get(`${name}.json`)
          addrToAbi.set(addr, { name, abi })
        }
      }

      for (const [step, { arena }] of test.traces) {
        if (step == "Deployment") {
          // Test contract address
          const name = testContractName.split(":")[1]
          const addr = arena[0].trace.address
          const abi = files.get(`${name}.json`)
          addrToAbi.set(addr, { name, abi })
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
        abi: val.abi?.abi || null,
      }
    } else {
      return {
        chain: "foundry-test",
        address: addr,
      }
    }
  })
}
