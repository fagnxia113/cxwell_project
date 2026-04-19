import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

// 解决 BigInt 无法被 JSON.stringify 的问题
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : '*',
    credentials: true,
  });
  
  // Swagger 配置
  const config = new DocumentBuilder()
    .setTitle('CxWell Backend API')
    .setDescription('CxWell 项目管理与工作流系统 API 文档')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  const appName = process.env.APP_NAME || 'CxWell Backend';
  console.log(`${appName} is running on port: ${port}`);
  console.log(`API documented at: http://localhost:${port}/api/docs`);
}
bootstrap();
