import { Router } from 'express'
import * as path from 'path'
import * as fs from 'fs'
import { ArquivoController, ErroDownload } from '../controllers/ArquivoController'

export const downloadRouter = Router()

downloadRouter.get('/:id', async (req, res) => {
    const id = req.params.id
    if (id && id.length == 24) {
        try {
            const bd = req.app.locals.db
            const arquivoCtrl = new ArquivoController(bd)
            const caminhoArquivo = await arquivoCtrl.realizarDownload(id)
            return res.download(caminhoArquivo, () => {
                fs.unlinkSync(path.resolve(caminhoArquivo))
            })
        } catch (erro) {
            switch (erro) {
                case ErroDownload.NAO_FOI_POSSIVEL_GRAVAR:
                    return res.status(500).json({ mensagem: ErroDownload.NAO_FOI_POSSIVEL_GRAVAR })
                case ErroDownload.NENHUM_ARQUIVO_ENCONTRADO:
                    return res.status(404).json({ mensagem: ErroDownload.NENHUM_ARQUIVO_ENCONTRADO })
                default: return res.status(500).json({ mensagem: 'Erro no servidor' })
            }
        }
    } else {
        return res.status(400).json({ mensagem: 'ID inválido' })
    }
})