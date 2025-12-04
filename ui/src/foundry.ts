import { Interface, ParamType } from "ethers"

type AbiInput = {
  type: string
  name: string
}

type AbiOutput = {
  type: string
  name: string
}

type AbiEntry = {
  type: string
  name?: string
  inputs?: AbiInput[]
  outputs?: AbiOutput[]
}

type Abi = {
  abi: AbiEntry[]
}

type FuncInput = {
  type: string
  name: string
  value: string
}

type FuncOutput = {
  type: string
  name: string
  value: string
}

type FuncCall = {
  depth: number
  children: number[]
  success: boolean
  address: string
  label: string
  funcName: string
  funcSig: string
  funcSelector: string
  inputs: FuncInput[]
  outputs: FuncOutput[]
  rawInput: string
  rawOutput: string
  gasCost: number
  value: string
}

type Trace = {
  depth: number
  success: boolean
  address: string
  data: string
  output: string
  gasUsed: number
  value: string
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
  labeledAddresses?: Record<string, string>
}

// Test contract name => test name => Test
type Tests = Record<string, { test_results: Record<string, Test> }>

type Func = {
  funcSig: string
  abi: AbiEntry
  iface: Interface
}

type WalkCtx = {
  labels: Record<string, string>
  funcSigs: Record<string, Record<string, Func>>
}

type WalkEntry = {
  filePath: string
  fileName: string
}

const LABELS: Record<string, string> = {
  "0x7109709ecfa91a80626ff3989d68f67f5b1dd12d": "Vm",
  "0x000000000000000000636f6e736f6c652e6c6f67": "Console",
}

/*
function addrToLabel(addr: string): string | null {
  return LABELS[addr.toLowerCase()] || null
}

function skip(contractName: string): boolean {
  return false
}


async function walkDir(
  rootPath: string,
  skipFn: (filePath: string, isDir: boolean, fileName: string) => boolean,
): Promise<WalkEntry[]> {
  const queue: string[] = [rootPath]
  const filePaths: WalkEntry[] = []

  while (queue.length > 0) {
    const path = queue.pop()!
    const entries = await readdir(path, { withFileTypes: true })

    for (const entry of entries) {
      const isDir = entry.isDirectory()
      const filePath = join(path, entry.name)
      const fileName = entry.name

      if (skipFn(filePath, isDir, fileName)) {
        continue
      }

      if (isDir) {
        queue.push(filePath)
      } else {
        filePaths.push({ filePath, fileName })
      }
    }
  }

  return filePaths
}

function getFileExt(fileName: string): string {
  return extname(fileName).slice(1)
}

function getFileName(fileName: string): string | null {
  const name = basename(fileName, extname(fileName))
  return name || null
}

function parseFunc(abiEntry: AbiEntry): {
  funcSig: string
  funcSelector: string
  iface: Interface
} | null {
  if (!abiEntry.name) {
    return null
  }

  const funcName = abiEntry.name
  const inputs = (abiEntry.inputs || []).map((i) => i.type.trim()).join(",")
  const outputs = (abiEntry.outputs || []).map((o) => o.type.trim()).join(",")

  let funcStr = `function ${funcName}(${inputs})`
  if (outputs) {
    funcStr += ` returns (${outputs})`
  }

  try {
    const iface = new Interface([funcStr])
    const fragment = iface.getFunction(funcName)
    if (!fragment) return null

    const funcSig = fragment.format("sighash")
    const funcSelector = iface.getFunction(funcName)!.selector

    return { funcSig, funcSelector, iface }
  } catch (error) {
    return null
  }
}

function resultToString(value: any, paramType: ParamType): string {
  if (paramType.baseType == "address" || paramType.baseType == "bytes") {
    return value.toString()
  }
  if (
    paramType.baseType.startsWith("uint") ||
    paramType.baseType.startsWith("int")
  ) {
    return value.toString()
  }
  if (paramType.baseType == "array" || paramType.baseType == "tuple") {
    return JSON.stringify(value)
  }
  return value.toString()
}

function decodeInputs(rawData: string, func: Func): FuncInput[] {
  if (!func.abi.inputs || func.abi.inputs.length == 0) {
    return []
  }

  try {
    const fragment = func.iface.getFunction(func.abi.name!)
    if (!fragment) return []

    const decoded = func.iface.decodeFunctionData(fragment, rawData)

    return func.abi.inputs.map((input, i) => ({
      type: input.type,
      name: input.name,
      value: resultToString(decoded[i], fragment.inputs[i]),
    }))
  } catch (error) {
    return []
  }
}

function decodeOutputs(rawData: string, func: Func): FuncOutput[] {
  if (!func.abi.outputs || func.abi.outputs.length == 0) {
    return []
  }

  try {
    const fragment = func.iface.getFunction(func.abi.name!)
    if (!fragment) return []

    const decoded = func.iface.decodeFunctionResult(fragment, rawData)

    return func.abi.outputs.map((output, i) => ({
      type: output.type,
      name: output.name,
      value: resultToString(decoded[i], fragment.outputs![i]),
    }))
  } catch (error) {
    return []
  }
}

function walk(arena: Arena, ctx: WalkCtx): FuncCall[] {
  const funcCalls: FuncCall[] = []

  dfs(
    0,
    (idx: number) => {
      const curr = arena.arena[idx]
      return curr ? curr.children : []
    },
    (i: number, depth: number, idx: number) => {
      const curr = arena.arena[idx]
      if (!curr) return

      const trace = curr.trace
      const rawData = trace.data
      const rawOutput = trace.output
      const funcSelector = rawData.length >= 10 ? rawData.slice(0, 10) : ""
      const gasCost = trace.gas_used
      const value = BigInt(trace.value || "0x0").toString()

      let funcName: string | null = null
      let funcSig: string | null = null
      let inputs: FuncInput[] = []
      let outputs: FuncOutput[] = []

      const label = ctx.labels[trace.address] || addrToLabel(trace.address)

      if (label) {
        const abiNames = labelToAbiNames(label) || [label]
        let func: Func | null = null

        for (const abiName of abiNames) {
          const funcMap = ctx.func_sigs[abiName]
          if (funcMap) {
            func = funcMap[funcSelector] || null
            if (func) {
              funcName = func.abi.name || ""
              funcSig = func.func_sig
              break
            }
          }
        }

        if (func) {
          if (rawData !== "0x") {
            inputs = decodeInputs(rawData, func)
          }
          if (rawOutput !== "0x") {
            outputs = decodeOutputs(rawOutput, func)
          }
        }
      }

      funcCalls.push({
        depth: trace.depth,
        children: curr.children,
        success: trace.success,
        address: trace.address,
        label: label || "",
        func_name: funcName || "",
        func_sig: funcSig || "",
        func_selector: funcSelector,
        inputs,
        outputs,
        raw_data: rawData,
        raw_output: rawOutput,
        gas_cost: gasCost,
        value,
      })
    },
  )

  return funcCalls
}

export async function getABIs(
  rootDir: string,
): Promise<Record<string, Record<string, Func>>> {
  const walkEntries = await walkDir(rootDir, (_, isDir, fileName) => {
    if (isDir) {
      return skip(fileName)
    } else {
      return getFileExt(fileName) !== "json"
    }
  })

  const abiFiles: Array<[string | null, AbiEntry[]]> = []

  for (const walkEntry of walkEntries) {
    const contractName = getFileName(walkEntry.file_name)
    try {
      const data = await readFile(walkEntry.file_path, "utf-8")
      const json: Abi = JSON.parse(data)
      abiFiles.push([contractName, json.abi])
    } catch (error) {
      // Skip invalid files
    }
  }

  const funcSigs: Record<string, Record<string, Func>> = {}

  for (const [contractName, abi] of abiFiles) {
    if (!contractName) continue

    if (!funcSigs[contractName]) {
      funcSigs[contractName] = {}
    }

    for (const abiEntry of abi) {
      if (abiEntry.type !== "function") continue

      const parsed = parseFunc(abiEntry)
      if (parsed) {
        funcSigs[contractName][parsed.funcSelector] = {
          func_sig: parsed.funcSig,
          abi: abiEntry,
          iface: parsed.iface,
        }
      }
    }
  }

  return funcSigs
}
*/

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
export function build(tests: Tests) {
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
            // TODO: remove ts-ignore
            dfs(
              // @ts-ignore
              arena[0].idx,
              // @ts-ignore
              (a) => arena[a].children,
              (i, d, a) => {
                console.log(i, a)
              },
            )
            break
          }
          default: {
            break
          }
        }
      }
    }
  }
  /*
  const labels: Record<string, string> = {}
  if (testRes.labeled_addresses) {
    Object.assign(labels, testRes.labeled_addresses)
  }

  for (const [label, arena] of Object.entries(testRes.traces)) {
    if (label == "Deployment") {
      const addr = arena.arena[0]?.trace.address
      if (addr) {
        labels[addr] = testContractName
      }
    } else if (label == "Execution") {
      return walk(arena, { labels, func_sigs: abis })
    }
    // Ignore Setup
  }
  */
}
