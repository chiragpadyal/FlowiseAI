import { INodeParams, INodeCredential } from '../src/Interface'

class ElasticSearchApi implements INodeCredential {
    label: string
    name: string
    version: number
    description: string
    inputs: INodeParams[]

    constructor() {
        this.label = 'Elastic Search API'
        this.name = 'ElasticSearchApi'
        this.version = 1.0
        this.inputs = [
            {
                label: 'User',
                name: 'user',
                type: 'string',
                placeholder: '<ElasticSearch_USERNAME>'
            },
            {
                label: 'Password',
                name: 'password',
                type: 'password',
                placeholder: '<ElasticSearch_PASSWORD>'
            }
        ]
    }
}

module.exports = { credClass: ElasticSearchApi }
