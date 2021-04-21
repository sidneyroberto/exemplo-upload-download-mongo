import { Router } from 'express'
import * as path from 'path'
import * as fs from 'fs'
import { ArquivoController, ErroUpload } from '../controllers/ArquivoController'

export const uploadRouter = Router()

uploadRouter.post('/', async (req, res) => {
    if (!req.files || Object.keys(req.files).length == 0) {
        return res.status(400).send('Nenhum arquivo recebido')
    }

    const nomesArquivos = Object.keys(req.files)
    const diretorio = path.join(__dirname, '..', '..', 'arquivos')
    if (!fs.existsSync(diretorio)) {
        fs.mkdirSync(diretorio)
    }

    const bd = req.app.locals.bd
    const arquivoCtrl = new ArquivoController(bd)
    const idsArquivosSalvos = []
    let quantidadeErroGravacao = 0
    let quantidadeErroObjArquivoInvalido = 0
    let quantidadeErroInesperado = 0

    const promises = nomesArquivos.map(async (arquivo) => {
        const objArquivo = req.files[arquivo]
        try {
            const idArquivo = await arquivoCtrl.realizarUpload(objArquivo)
            idsArquivosSalvos.push(idArquivo)
        } catch (erro) {
            switch (erro) {
                case ErroUpload.NAO_FOI_POSSIVEL_GRAVAR:
                    quantidadeErroGravacao++
                    break
                case ErroUpload.OBJETO_ARQUIVO_INVALIDO:
                    quantidadeErroObjArquivoInvalido++
                    break
                default:
                    quantidadeErroInesperado++
            }
        }
    })

    await Promise.all(promises)

    res.json({
        idsArquivosSalvos,
        quantidadeErroGravacao,
        quantidadeErroInesperado,
        quantidadeErroObjArquivoInvalido
    })

})