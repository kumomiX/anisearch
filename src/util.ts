import * as readline from 'readline'

export const askToMakeAChoice = async (): Promise<any> => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  const choice = await new Promise((resolve, error) => {
    rl.question(
      '>  ',
      (answer: string): any => {
        rl.close()
        resolve(answer)
      }
    )
  })

  return choice
}
