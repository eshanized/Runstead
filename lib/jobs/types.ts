export type JobType =
  | 'provision_service'
  | 'suspend_service'
  | 'unsuspend_service'
  | 'terminate_service'
  | 'create_backup'
  | 'sync_dns_records'
  | 'send_notification'
  | 'generate_recurring_invoices';

export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'canceled';

export interface ProvisionServicePayload {
  tenantId: string;
  orderId?: string;
  customerId: string;
  serviceId?: string;
  productId?: string;
  domain?: string;
  package?: string;
  username?: string;
}

export interface JobExecutionResult {
  jobId: string;
  jobType: JobType;
  status: JobStatus;
  attempts: number;
  error?: string;
  result?: any;
}
