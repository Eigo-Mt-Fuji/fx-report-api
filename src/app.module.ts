import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersController } from './users/users.controller';
import { PostsController } from './posts/posts.controller';
import { FxAnalysisController } from './fx-analysis/fx-analysis.controller';
import { ConfigModule } from '@nestjs/config';
import { FxAnalysisService } from './fx-analysis/fx-analysis.service';

@Module({
  imports: [ConfigModule.forRoot({ envFilePath: ['.env.local', '.env'] })],
  controllers: [AppController, UsersController, PostsController, FxAnalysisController],
  providers: [AppService, FxAnalysisService],
})
export class AppModule {}
