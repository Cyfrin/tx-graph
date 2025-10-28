export async function post<Req, Res>(url: string, params: Req): Promise<Res> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  })

  if (!res.ok) {
    throw new Error(`HTTP error ${res.status}`)
  }

  return await res.json()
}

export async function get<Res>(url: string): Promise<Res> {
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })

  if (!res.ok) {
    throw new Error(`HTTP error ${res.status}`)
  }

  return await res.json()
}
