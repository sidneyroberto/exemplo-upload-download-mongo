import { app } from './app'
import { conectarNoBD } from './config/bd'

const port = process.env.PORT || 3000

const server = app.listen(
    port,
    () => console.log(`App ouvindo na porta ${port}`)
)

conectarNoBD()

process.on('SIGINT', () => {
    server.close()
    console.log('App finalizado')
})