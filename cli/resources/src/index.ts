import { Command } from 'commander'
import { runValidate } from './validate.js'

const program = new Command()

program
  .name('archui')
  .description('ArchUI CLI — filesystem validator and module manager')
  .version('0.1.0')

program
  .command('validate [path]')
  .description('Validate filesystem conformance against ArchUI rules')
  .option('--only <validator>', 'Run only a specific validator (structure|frontmatter|links|index)')
  .action((targetPath: string | undefined, options: { only?: string }) => {
    const root = targetPath ?? process.cwd()
    const { exitCode } = runValidate(root, options.only)
    process.exit(exitCode)
  })

program.parse()
