import { ethers } from 'ethers';

export interface JitApiSpec {
  name: string;
  targetUrl: string;
  pricePerQueryUsdc: string;
  category: string;
  description: string;
}

export interface DeploymentResult {
  apiId: string;
  name: string;
  endpointUrl: string;
  pricePerQueryUsdc: string;
  payToAddress: string;
  conwaySandboxId: string;
  status: string;
  createdAt: string;
}

export class ApiFactoryService {
  private deployedApis: Map<string, DeploymentResult> = new Map();

  public async deployJitApi(spec: JitApiSpec, creatorAddress: string): Promise<DeploymentResult> {
    const apiId = 'api_' + ethers.keccak256(ethers.toUtf8Bytes(spec.name + Date.now())).slice(2, 10);
    const sandboxId = 'sandbox_' + Math.random().toString(36).substring(2, 10);
    const domainName = `${spec.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.life.conway.tech`;

    const deployment: DeploymentResult = {
      apiId,
      name: spec.name,
      endpointUrl: `https://${domainName}/v1/query`,
      pricePerQueryUsdc: spec.pricePerQueryUsdc || '0.10',
      payToAddress: creatorAddress,
      conwaySandboxId: sandboxId,
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    };

    this.deployedApis.set(apiId, deployment);
    return deployment;
  }

  public getApi(apiId: string): DeploymentResult | undefined {
    return this.deployedApis.get(apiId);
  }

  public listApis(): DeploymentResult[] {
    return Array.from(this.deployedApis.values());
  }
}
