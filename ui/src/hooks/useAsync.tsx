import { useState } from "react"

type State<T> = {
  running: boolean
  error: any
  data: T | null
}

type Response<T> = {
  data?: T
  error?: any
}

interface UseAsync<P, T> extends State<T> {
  exec: (params: P) => Promise<Response<T>>
  reset: () => void
}

export default function useAsync<P, T>(
  req: (params: P) => Promise<T>,
): UseAsync<P, T> {
  const STATE: State<T> = {
    running: false,
    error: null,
    data: null,
  }

  const [state, setState] = useState<State<T>>(STATE)

  const exec = async (params: P): Promise<Response<T>> => {
    setState({
      running: true,
      data: null,
      error: null,
    })

    try {
      const data = await req(params)

      setState((state) => ({
        ...state,
        running: false,
        data,
      }))

      return { data }
    } catch (error) {
      setState((state) => ({
        ...state,
        running: false,
        error,
      }))

      return { error }
    }
  }

  const reset = () => {
    setState(STATE)
  }

  return {
    ...state,
    exec,
    reset,
  }
}
