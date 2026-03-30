import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

const APP_NAME = 'DigiStore'

const baseStyle = {
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  backgroundColor: '#f9fafb',
}
const container = {
  maxWidth: '560px',
  margin: '0 auto',
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  padding: '40px 32px',
}
const heading = { fontSize: '22px', fontWeight: '700', color: '#111827', margin: '0 0 8px' }
const text = { fontSize: '15px', color: '#374151', lineHeight: '1.6', margin: '8px 0' }
const muted = { fontSize: '13px', color: '#6b7280', margin: '4px 0' }
const hr = { borderColor: '#e5e7eb', margin: '24px 0' }
const button = {
  backgroundColor: '#111827',
  color: '#ffffff',
  borderRadius: '6px',
  padding: '12px 24px',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
  display: 'inline-block',
}

// ─────────────────────────────────────────────
// Payment Failed
// ─────────────────────────────────────────────

export interface PaymentFailedProps {
  productName: string
  planName: string
  nextRetryDate: string | null
  dashboardUrl: string
}

export function PaymentFailedEmail({
  productName,
  planName,
  nextRetryDate,
  dashboardUrl,
}: PaymentFailedProps) {
  return (
    <Html>
      <Head />
      <Preview>Payment failed for your {productName} subscription</Preview>
      <Body style={baseStyle}>
        <Container style={container}>
          <Heading style={heading}>Payment failed</Heading>
          <Text style={text}>
            We couldn&apos;t process your payment for <strong>{productName}</strong> ({planName}).
          </Text>
          <Text style={text}>
            Your access is maintained while we retry. No action is needed from you at this time.
          </Text>
          {nextRetryDate && (
            <Text style={muted}>Next retry: {nextRetryDate}</Text>
          )}
          <Hr style={hr} />
          <Text style={text}>
            If your card details have changed, please update them through your bank or card provider.
          </Text>
          <Section style={{ textAlign: 'center', marginTop: '24px' }}>
            <Button href={dashboardUrl} style={button}>View license</Button>
          </Section>
          <Hr style={hr} />
          <Text style={muted}>{APP_NAME} · You received this because you have an active subscription.</Text>
        </Container>
      </Body>
    </Html>
  )
}

// ─────────────────────────────────────────────
// Payment Recovered
// ─────────────────────────────────────────────

export interface PaymentRecoveredProps {
  productName: string
  planName: string
  nextRenewalDate: string
  dashboardUrl: string
}

export function PaymentRecoveredEmail({
  productName,
  planName,
  nextRenewalDate,
  dashboardUrl,
}: PaymentRecoveredProps) {
  return (
    <Html>
      <Head />
      <Preview>Payment successful — {productName} subscription restored</Preview>
      <Body style={baseStyle}>
        <Container style={container}>
          <Heading style={heading}>Payment successful</Heading>
          <Text style={text}>
            Your payment for <strong>{productName}</strong> ({planName}) was processed successfully.
            Your subscription is fully active again.
          </Text>
          <Text style={muted}>Next renewal: {nextRenewalDate}</Text>
          <Section style={{ textAlign: 'center', marginTop: '24px' }}>
            <Button href={dashboardUrl} style={button}>View license</Button>
          </Section>
          <Hr style={hr} />
          <Text style={muted}>{APP_NAME} · You received this because you have an active subscription.</Text>
        </Container>
      </Body>
    </Html>
  )
}

// ─────────────────────────────────────────────
// Subscription Cancelled
// ─────────────────────────────────────────────

export interface SubscriptionCancelledProps {
  productName: string
  planName: string
  accessUntilDate: string
  storeUrl: string
}

export function SubscriptionCancelledEmail({
  productName,
  planName,
  accessUntilDate,
  storeUrl,
}: SubscriptionCancelledProps) {
  return (
    <Html>
      <Head />
      <Preview>Your {productName} subscription has been cancelled</Preview>
      <Body style={baseStyle}>
        <Container style={container}>
          <Heading style={heading}>Subscription cancelled</Heading>
          <Text style={text}>
            Your <strong>{productName}</strong> ({planName}) subscription has been scheduled for cancellation.
          </Text>
          <Text style={text}>
            You&apos;ll keep full access until <strong>{accessUntilDate}</strong>.
            After that date, your license will expire.
          </Text>
          <Hr style={hr} />
          <Text style={text}>Changed your mind? You can reactivate from your dashboard before that date.</Text>
          <Section style={{ textAlign: 'center', marginTop: '24px' }}>
            <Button href={storeUrl} style={button}>Browse plans</Button>
          </Section>
          <Hr style={hr} />
          <Text style={muted}>{APP_NAME} · You received this because you cancelled a subscription.</Text>
        </Container>
      </Body>
    </Html>
  )
}

// ─────────────────────────────────────────────
// Trial Expired
// ─────────────────────────────────────────────

export interface TrialExpiredProps {
  productName: string
  planName: string
  storeUrl: string
}

export function TrialExpiredEmail({
  productName,
  planName,
  storeUrl,
}: TrialExpiredProps) {
  return (
    <Html>
      <Head />
      <Preview>Your free trial for {productName} has ended</Preview>
      <Body style={baseStyle}>
        <Container style={container}>
          <Heading style={heading}>Your free trial has ended</Heading>
          <Text style={text}>
            Your {planName} trial for <strong>{productName}</strong> has expired.
          </Text>
          <Text style={text}>
            Upgrade to a paid plan to keep your access and unlock all features.
          </Text>
          <Section style={{ textAlign: 'center', marginTop: '24px' }}>
            <Button href={storeUrl} style={button}>Upgrade now</Button>
          </Section>
          <Hr style={hr} />
          <Text style={muted}>{APP_NAME} · You received this because your free trial ended.</Text>
        </Container>
      </Body>
    </Html>
  )
}

// ─────────────────────────────────────────────
// Trial Expiring Soon
// ─────────────────────────────────────────────

export interface TrialExpiringSoonProps {
  productName: string
  planName: string
  daysLeft: number
  expiresDate: string
  storeUrl: string
}

export function TrialExpiringSoonEmail({
  productName,
  planName,
  daysLeft,
  expiresDate,
  storeUrl,
}: TrialExpiringSoonProps) {
  return (
    <Html>
      <Head />
      <Preview>Your {productName} trial expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}</Preview>
      <Body style={baseStyle}>
        <Container style={container}>
          <Heading style={heading}>
            Your trial expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}
          </Heading>
          <Text style={text}>
            Your {planName} trial for <strong>{productName}</strong> expires on <strong>{expiresDate}</strong>.
          </Text>
          <Text style={text}>
            Upgrade now to keep your access without any interruption.
          </Text>
          <Section style={{ textAlign: 'center', marginTop: '24px' }}>
            <Button href={storeUrl} style={button}>Upgrade before it expires</Button>
          </Section>
          <Hr style={hr} />
          <Text style={muted}>{APP_NAME} · You received this because your free trial is ending soon.</Text>
        </Container>
      </Body>
    </Html>
  )
}

// ─────────────────────────────────────────────
// Purchase Confirmation
// ─────────────────────────────────────────────

export interface PurchaseConfirmationProps {
  productName: string
  planName: string
  planType: 'perpetual' | 'subscription' | 'trial'
  amountPaid: string
  userName: string | null
  dashboardUrl: string
  expiresAt: string | null
}

export function PurchaseConfirmationEmail({
  productName,
  planName,
  planType,
  amountPaid,
  userName,
  dashboardUrl,
  expiresAt,
}: PurchaseConfirmationProps) {
  const firstName = userName?.split(' ')[0] ?? null
  return (
    <Html>
      <Head />
      <Preview>Your {productName} purchase is confirmed</Preview>
      <Body style={baseStyle}>
        <Container style={container}>
          <Heading style={heading}>Order confirmed</Heading>
          <Text style={text}>Hi {firstName ?? 'there'},</Text>
          <Text style={text}>
            Your purchase of <strong>{productName}</strong> ({planName}) has been processed successfully.
          </Text>
          <Text style={muted}>Amount charged: {amountPaid}</Text>
          <Hr style={hr} />
          {planType === 'trial' && expiresAt ? (
            <Text style={text}>
              Your free trial is now active. Your card will be charged automatically on{' '}
              <strong>{expiresAt}</strong>. You can cancel any time before that date.
            </Text>
          ) : planType === 'subscription' ? (
            <Text style={text}>
              Your subscription is active and will renew automatically.
            </Text>
          ) : (
            <Text style={text}>
              You have lifetime access to this product.
            </Text>
          )}
          <Section style={{ textAlign: 'center', marginTop: '24px' }}>
            <Button href={dashboardUrl} style={button}>Go to your dashboard</Button>
          </Section>
          <Hr style={hr} />
          <Text style={muted}>{APP_NAME} · You received this because you made a purchase.</Text>
        </Container>
      </Body>
    </Html>
  )
}
