import { Module } from '@nestjs/common';
import { AccessKeyService } from './access-key.service';
import { XmlBuilderService } from './xml-builder.service';
import { XmlSignerService } from './xml-signer.service';

@Module({
  providers: [AccessKeyService, XmlBuilderService, XmlSignerService],
  exports: [AccessKeyService, XmlBuilderService, XmlSignerService],
})
export class XmlEngineModule {}
