import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Stripe } from 'stripe';
import { AuditService } from './AuditService';
import { HIPAAEncryptionService } from '../../utils/HIPAACompliance';

export interface PaymentIntentData {
  amount: number;
  patientId: string;
  description: string;
  metadata: {
    serviceDate: string;
    hcpcsCode: string;
    insuranceProvider?: string;
  };
}

@Injectable()
export class BillingService {
  private stripe: Stripe;

  constructor(
    private configService: ConfigService,
    private auditService: AuditService,
    private hipaaService: HIPAAEncryptionService
  ) {
    this.stripe = new Stripe(this.configService.get('STRIPE_SECRET_KEY'), {
      apiVersion: '2023-08-16',
      typescript: true,
    });
  }

  async createPaymentIntent(data: PaymentIntentData) {
    const encryptedData = this.hipaaService.encryptSensitiveData(data);
    
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: data.amount * 100, // Convert dollars to cents
        currency: 'usd',
        metadata: data.metadata,
        description: data.description,
        payment_method_types: ['card'],
        setup_future_usage: 'off_session',
      });

      await this.auditService.logTransaction({
        userId: data.patientId,
        action: 'payment_intent_created',
        entityId: paymentIntent.id,
        entityType: 'billing',
        encryptedData,
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error) {
      await this.auditService.logError({
        userId: data.patientId,
        action: 'payment_intent_failed',
        error: error.message,
        metadata: data.metadata,
      });
      throw new Error('Payment processing failed');
    }
  }

  // Additional methods for insurance claims and reporting would go here
}