import {handleAIGatewayRequest} from '../server/aiGatewayHandler';

export default function handler(request: Request): Promise<Response> {
  return handleAIGatewayRequest(request, process.env);
}
