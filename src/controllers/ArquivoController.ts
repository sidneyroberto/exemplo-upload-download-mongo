import * as path from 'path'
import * as fs from 'fs'
import {
    Db,
    ObjectId,
    GridFSBucket,
    ObjectID
} from 'mongodb'

export enum ErroDownload {
    NAO_FOI_POSSIVEL_GRAVAR = 'Não foi possível preparar o arquivo para download',
    NENHUM_ARQUIVO_ENCONTRADO = 'Nenhum arquivo encontrado com este ID'
}

export enum ErroUpload {
    OBJETO_ARQUIVO_INVALIDO = 'O objeto do arquivo é inválido',
    NAO_FOI_POSSIVEL_GRAVAR = 'Ocorreu um erro ao tentar gravar o arquivo'
}

export class ArquivoController {

    bd: Db
    diretorio: string

    constructor(bd: Db) {
        this.bd = bd
        this.diretorio = path.join(__dirname, '..', '..', 'arquivos_temporarios')
        if (!fs.existsSync(this.diretorio)) {
            fs.mkdirSync(this.diretorio)
        }
    }

    private _objetoArquivoEhValido(objArquivo: any): boolean {
        return objArquivo
            && 'name' in objArquivo
            && 'data' in objArquivo
            && objArquivo['name']
            && objArquivo['data']
    }

    realizarUpload(objArquivo: any): Promise<ObjectId> {
        return new Promise((resolve, reject) => {
            if (this._objetoArquivoEhValido(objArquivo)) {
                const bucket = this._inicializarBucket()
                const nomeArquivo = objArquivo['name']
                const conteudoArquivo = objArquivo['data']
                const nomeArquivoTemp = `${nomeArquivo}_${(new Date().getTime())}`

                const caminhoArquivo = path.join(this.diretorio, nomeArquivoTemp)
                fs.writeFileSync(caminhoArquivo, conteudoArquivo)

                const streamGridFS = bucket.openUploadStream(nomeArquivo, {
                    metadata: {
                        mimetype: objArquivo['mimetype']
                    }
                })
                const streamLeitura = fs.createReadStream(caminhoArquivo)
                streamLeitura
                    .pipe(streamGridFS)
                    .on(
                        'error',
                        erro => {
                            reject(ErroUpload.NAO_FOI_POSSIVEL_GRAVAR)
                        }
                    )
                    .on(
                        'finish',
                        () => {
                            fs.unlinkSync(caminhoArquivo)
                            resolve(new ObjectId(`${streamGridFS.id}`))
                        }
                    )
            } else {
                reject(ErroUpload.OBJETO_ARQUIVO_INVALIDO)
            }


        })
    }

    realizarDownload(id: string): Promise<string> {
        return new Promise(async (resolve, reject) => {
            const bucket = this._inicializarBucket()

            const _id = new ObjectID(id)
            const resultados = await bucket.find({ '_id': _id }).toArray()
            if (resultados.length > 0) {
                const metadadosArquivo = resultados[0]
                const streamGridFS = bucket.openDownloadStream(_id)
                const caminhoArquivo = path.join(this.diretorio, metadadosArquivo.filename)
                const streamGravacao = fs.createWriteStream(caminhoArquivo)
                streamGridFS
                    .pipe(streamGravacao)
                    .on(
                        'error',
                        erro => {
                            reject(ErroDownload.NAO_FOI_POSSIVEL_GRAVAR)
                        }
                    )
                    .on(
                        'finish',
                        () => {
                            resolve(caminhoArquivo)
                        }
                    )
            } else {
                reject(ErroDownload.NENHUM_ARQUIVO_ENCONTRADO)
            }
        })
    }

    private _inicializarBucket(): GridFSBucket {
        return new GridFSBucket(this.bd, {
            bucketName: 'arquivos'
        })
    }
}