import * as express from 'express'
import * as fileUpload from 'express-fileupload'
import * as cors from 'cors'
import * as logger from 'morgan'

import { uploadRouter } from './routes/upload'
import { downloadRouter } from './routes/download'

export const app = express()

app.use(cors())
app.use(logger('dev'))
app.use(fileUpload())

app.use('/upload', uploadRouter)
app.use('/download', downloadRouter)