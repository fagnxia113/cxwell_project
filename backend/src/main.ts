import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));

  app.enableCors({
    origin: (origin, callback) => {
      // 允许没有 origin 的请求 (如移动端或直接访问)
      if (!origin) return callback(null, true);
      
      const allowedOrigins = process.env.CORS_ORIGINS
        ? process.env.CORS_ORIGINS.split(',').map(s => s.trim())
        : ['http://localhost:3000', 'http://localhost:5173'];
      
      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        // 在生产环境下，建议严格限制。目前保持 permissive 以兼容公网部署调试
        callback(null, true);
      }
    },
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  }));

  const port = process.env.PORT || 3000;
  await app.listen(port);

  const appName = process.env.APP_NAME || 'CxWell Backend';
  console.log(`${appName} is running on port: ${port}`);
}
bootstrap();
