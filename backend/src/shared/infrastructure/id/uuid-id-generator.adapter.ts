import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import type { IdGeneratorPort } from '../../application/ports/id-generator.port';

@Injectable()
export class UuidIdGeneratorAdapter implements IdGeneratorPort {
  generate(): string {
    return uuidv4();
  }
}
