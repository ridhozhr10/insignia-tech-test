import { Injectable } from "@nestjs/common";
import { meaningOfLife } from "@ridhozhr10/foo";

@Injectable()
export class AppService {
  getHello = (): string => `The meaning of life is: ${meaningOfLife}`;
}
