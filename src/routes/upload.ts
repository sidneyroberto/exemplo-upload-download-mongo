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
    const diretorio = path.join(__dirname, '..', '..', 'arquivos_temporarios')
    if (!fs.existsSync(diretorio)) {
        fs.mkdirSync(diretorio)
    }

    const bd = req.app.locals.db

    const arquivoCtrl = new ArquivoController(bd)

    const idsArquivosSalvos = []

    const promises = nomesArquivos.map(async (arquivo) => {
        const objArquivo = req.files[arquivo]
        try {
            const id = await arquivoCtrl.realizarUpload(objArquivo)
            idsArquivosSalvos.push(id)
        } catch (erro) {
            switch (erro) {
                case ErroUpload.NAO_FOI_POSSIVEL_GRAVAR:
                    return res.status(500).json({ mensagem: ErroUpload.NAO_FOI_POSSIVEL_GRAVAR })
                case ErroUpload.OBJETO_ARQUIVO_INVALIDO:
                    return res.status(400).json({ mensagem: ErroUpload.OBJETO_ARQUIVO_INVALIDO })
                default:
                    return res.status(500).json({ mensagem: 'Erro no servidor' })
            }
        }
    })

    await Promise.all(promises)

    res.json(idsArquivosSalvos)
})