import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { MailModule } from './mail/mail.module';
import { BrandsModule } from './modules/brands/brands.module';
import { TiresModule } from './modules/tires/tires.module';
import { BlogsModule } from './modules/blogs/blogs.module';
import { BlogCategoriesModule } from './modules/blog-categories/blog-categories.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsersModule,
    AuthModule,
    MailModule,
    BrandsModule,
    TiresModule,
    BlogsModule,
    BlogCategoriesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

