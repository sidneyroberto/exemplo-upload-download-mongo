import { MongoClient } from 'mongodb'

import { app } from '../app'

const URI_BD = process.env.URI_BD

export const conectarNoBD = async () => {
    const clienteBD = new MongoClient(URI_BD, {
        useUnifiedTopology: true,
        useNewUrlParser: true
    })

    try {
        const conexao = await clienteBD.connect()
        console.log(`App conectado ao bd ${conexao.db().databaseName}`)
        app.locals.db = conexao.db()

        process.on('SIGINT', async () => {
            try {
                await conexao.close()
                console.log('Conexão com o bd fechada')
            } catch (erro) {
                console.log(erro)
            }
        })
    } catch (erro) {
        console.log(erro)
    }
}
