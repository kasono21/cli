const debug = require('debug')('codefresh:cli:create:context');
const Command = require('../../Command');
const CFError = require('cf-errors');
const _ = require('lodash');
const { runtimeEnvironments } = require('../../../../logic').api;
const applyRoot = require('../root/apply.cmd');


const command = new Command({
    command: 'runtime-environments [name]',
    aliases: ['re','runtime-environment'],
    parent: applyRoot,
    description: 'apply changes to runtime-environments resource',
    usage: 'Use apply to patch an existing context',
    webDocs: {
        category: 'Runtime-Environments (On Prem)',
        title: 'Apply Runtime-Environments',
        weight: 90,
    },
    builder: (yargs) => {
        return yargs
            .positional('name', {
                describe: 'Runtime environments name',
            })
            .option('default', {
                describe: 'Set the chosen runtime environment as default',
            })
            .option('extends', {
                describe: 'Set the runtime environments you want to extends from',
                type: Array,
                default: [],
            })
            .option('namespace', {
                alias: 'ns',
                describe: 'Set the namespace',
            })
            .option('cluster', {
                alias: 'c',
                describe: 'Set the cluster name',
            })
            .option('description', {
                alias: 'd',
                describe: 'Description of the new runtime environment',
            })
            .option('account-infra', {
                alias: 'ai',
                type: Boolean,
                default: true,
                describe: 'Set if the runtime environment is running under the account infrastructure',
            })
            .example('codefresh patch runtime-environments -f ./re.yml', 'Apply changes to a runtime-environment');
    },
    handler: async (argv) => {
        if (argv.filename) {
            const data = argv.filename;
            const name = _.get(data, 'metadata.name');
            if (!name) {
                throw new CFError('Missing name in metadata');
            }
        } else {
            const name = argv.name;
            const description = argv.description;
            if (!name) {
                throw new CFError('Must Provide a runtime environment name');
            }
            const accountInfra = argv['account-infra'];
            if (argv.default) {
                try {
                    await runtimeEnvironments.setDefaultForAccount(name);
                    console.log(`Runtime-Environment: '${name}' set as a default.`);
                } catch (err) {
                    throw (err);
                }
            } else {
                if (accountInfra) {
                    if (!argv.cluster || !argv.namespace) {
                        throw new CFError('Must Provide cluster name and namespace');
                    }
                }
                const extend = argv.extends;
                const body = {
                    runtimeScheduler: {
                        cluster: {
                            clusterProvider: {
                                selector: argv.cluster,
                            },
                            namespace: argv.namespace,
                        },
                    },
                    dockerDaemonScheduler: {
                        cluster: {
                            clusterProvider: {
                                selector: argv.cluster,
                            },
                            namespace: argv.namespace,
                        },
                    },
                };
                await runtimeEnvironments.applyByNameForAccount({
                    name,
                    extend,
                    accountInfra,
                    description,
                    body,
                });
                console.log(`Runtime-Environment: '${name}' patched.`);
            }
        }
    },
});


module.exports = command;
