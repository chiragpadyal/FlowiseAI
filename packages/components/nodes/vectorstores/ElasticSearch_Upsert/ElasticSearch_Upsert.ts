import { ICommonObject, INode, INodeData, INodeOutputsValue, INodeParams } from '../../../src/Interface'
import { Embeddings } from 'langchain/embeddings/base'
import { getBaseClasses, getCredentialData, getCredentialParam } from '../../../src/utils'

import { ElasticClientArgs, ElasticVectorSearch } from 'langchain/vectorstores/elasticsearch'
import { Document } from 'langchain/document'

import { Client, ClientOptions } from '@elastic/elasticsearch'
import { flatten } from 'lodash'

class ElasticSearch_VectorStores implements INode {
    label: string
    name: string
    version: number
    description: string
    type: string
    icon: string
    category: string
    baseClasses: string[]
    inputs: INodeParams[]
    credential: INodeParams
    outputs: INodeOutputsValue[]

    constructor() {
        this.label = 'ElasticSearch Upsert Document'
        this.name = 'elasticSearchUpsert'
        this.version = 1.0
        this.type = 'ElasticSearch'
        this.icon = 'elasticsearch.svg'
        this.category = 'Vector Stores'
        this.description = 'Upsert documents to Elastic Search'
        this.baseClasses = [this.type, 'VectorStoreRetriever', 'BaseRetriever']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['ElasticSearchApi']
        }
        this.inputs = [
            {
                label: 'Document',
                name: 'document',
                type: 'Document'
            },
            {
                label: 'Embeddings',
                name: 'embeddings',
                type: 'Embeddings'
            },
            {
                label: 'Elastic Index',
                name: 'elasticIndex',
                type: 'string'
            },
            {
                label: 'Elastic URL',
                name: 'elasticURL',
                type: 'string'
            },
            {
                label: 'Top K',
                name: 'topK',
                description: 'Number of top results to fetch. Default to 4',
                placeholder: '4',
                type: 'number',
                additionalParams: true,
                optional: true
            }
        ]
        this.outputs = [
            {
                label: 'Elastic Search Retriever',
                name: 'retriever',
                baseClasses: this.baseClasses
            },
            {
                label: 'Elastic Search Vector Store',
                name: 'vectorStore',
                baseClasses: [this.type, ...getBaseClasses(ElasticVectorSearch)]
            }
        ]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const ElasticSearch_URL = nodeData.inputs?.elasticURL as string
        const topK = nodeData.inputs?.topK as string

        const embeddings = nodeData.inputs?.embeddings as Embeddings
        const docs = nodeData.inputs?.document as Document[]
        const output = nodeData.outputs?.output as string
        const k = topK ? parseFloat(topK) : 4
        const elasticIndex = nodeData.inputs?.elasticIndex as string

        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const ElasticSearch_USERNAME = getCredentialParam('user', credentialData, nodeData)
        const ElasticSearch_PASSWORD = getCredentialParam('password', credentialData, nodeData)

        const config: ClientOptions = {
            node: ElasticSearch_URL ?? ''
        }

        if (ElasticSearch_USERNAME && ElasticSearch_PASSWORD) {
            config.auth = {
                username: ElasticSearch_USERNAME,
                password: ElasticSearch_PASSWORD
            }
        }

        const clientArgs: ElasticClientArgs = {
            client: new Client(config),
            indexName: elasticIndex ?? 'test_vectorstore'
        }

        const flattenDocs = docs && docs.length ? flatten(docs) : []
        const finalDocs = []
        for (let i = 0; i < flattenDocs.length; i += 1) {
            finalDocs.push(new Document(flattenDocs[i]))
        }

        const vectorStore = await ElasticVectorSearch.fromDocuments(docs, embeddings, clientArgs)

        if (output === 'retriever') {
            const retriever = vectorStore.asRetriever(k)
            return retriever
        } else if (output === 'vectorStore') {
            ;(vectorStore as any).k = k
            return vectorStore
        }
        return vectorStore
    }
}

module.exports = { nodeClass: ElasticSearch_VectorStores }
