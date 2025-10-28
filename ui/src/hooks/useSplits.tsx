import { useReducer } from "react"
import { assert } from "../utils"

export type State = {
  root: {
    width: number
    height: number
    top: number
    left: number
  }
  split: number
}

type Init = {
  type: "init"
  width: number
  height: number
  top: number
  left: number
  split: number
}

type Reset = {
  type: "reset"
}

type Drag = {
  type: "drag"
  split: number
}

type Resize = {
  type: "resize"
  width: number
  height: number
  top: number
  left: number
}

type Action = Init | Reset | Drag | Resize

function reducer(state: State | null = null, action: Action): State | null {
  try {
    switch (action.type) {
      case "init": {
        assert(action.split >= action.top, "split < top")
        assert(action.split <= action.top + action.height, "split > bottom")
        const root = {
          width: action.width,
          height: action.height,
          top: action.top,
          left: action.left,
        }
        return {
          root,
          split: action.split,
        }
      }
      case "drag": {
        // @ts-ignore
        assert(action.split >= state.root.top, "split < top")
        assert(
          // @ts-ignore
          action.split <= state.root.top + state.root.height,
          "split > bottom",
        )
        // @ts-ignore
        return {
          ...state,
          split: action.split,
        }
      }
      case "resize": {
        return {
          root: {
            width: action.width,
            height: action.height,
            top: action.top,
            left: action.left,
          },
          split: action.height >> 1,
        }
      }
      case "reset": {
        return null
      }
      default: {
        return state
      }
    }
  } catch (e) {
    console.log("Split error:", e)
  }
  return state
}

export type UseSplits = {
  state: State | null
  init(params: {
    width: number
    height: number
    top: number
    left: number
    split: number
  }): void
  reset(): void
  drag(params: { split: number }): void
  resize(params: {
    width: number
    height: number
    top: number
    left: number
  }): void
}

export default function useSplits(): UseSplits {
  const [state, dispatch] = useReducer(reducer, null)

  const init = (params: {
    width: number
    height: number
    top: number
    left: number
    split: number
  }) => {
    dispatch({
      type: "init",
      width: params.width,
      height: params.height,
      top: params.top,
      left: params.left,
      split: params.split,
    })
  }

  const reset = () => {
    dispatch({ type: "reset" })
  }

  const drag = (params: { split: number }) => {
    dispatch({
      type: "drag",
      split: params.split,
    })
  }

  const resize = (params: {
    width: number
    height: number
    top: number
    left: number
  }) => {
    dispatch({
      type: "resize",
      width: params.width,
      height: params.height,
      top: params.top,
      left: params.left,
    })
  }

  return {
    state,
    init,
    reset,
    drag,
    resize,
  }
}
