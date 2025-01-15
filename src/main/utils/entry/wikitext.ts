const surroundTexts: Record<string, [string, string]> = {
  lj: ['{{lj|', '}}'],
  inlink: ['[[', ']]'],
  outlink: ['[', ']']
}

export function join(names: string | string[], surrounders: string[], separator: string = '、'): string {
  let result: string | string[]
  if (typeof names === 'string') {
    result = [names]
  } else {
    result = names
  }
  if (surrounders) {
    for (const srd of surrounders.reverse()) {
      result = result.map(name => surroundTexts[srd][0] + name + surroundTexts[srd][1]);
    }
  }
  result = result.join(separator)
  return result
}
