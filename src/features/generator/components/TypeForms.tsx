import React from 'react'
import { Input } from '../../../shared/components/ui/Input'
import { Select } from '../../../shared/components/ui/Select'
import { Checkbox } from '../../../shared/components/ui/Checkbox'
import { type QRCodeType } from '../../../shared/types'
import { CRYPTO_CURRENCIES, getCryptoCurrency } from '../../../shared/lib/crypto-currencies'

export interface TypeFormRendererProps {
  type: QRCodeType
  metadata: Record<string, string>
  onChange: (key: string, value: string) => void
  errors: Record<string, string>
}

export const TypeFormRenderer: React.FC<TypeFormRendererProps> = ({
  type,
  metadata,
  onChange,
  errors,
}) => {
  const formId = React.useId()
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    onChange(e.target.name, e.target.value)
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.name, e.target.checked ? 'true' : 'false')
  }

  switch (type) {
    case 'url':
      return (
        <div className="flex flex-col gap-4">
          <Input
            label="Website URL"
            name="url"
            value={metadata.url || ''}
            onChange={handleInputChange}
            placeholder="https://example.com"
            error={errors.url}
            required
            autoFocus
          />
        </div>
      )

    case 'text':
      return (
        <div className="flex flex-col gap-1.5 w-full">
          <label htmlFor={`${formId}-text`} className="text-xs font-semibold text-brand-lightText/60 px-1 uppercase tracking-wider">
            Plain Text
          </label>
          <textarea
            id={`${formId}-text`}
            name="text"
            value={metadata.text || ''}
            onChange={handleInputChange}
            placeholder="Type your message here..."
            className="glass-input min-h-[100px] w-full resize-y"
            required
            autoFocus
            aria-invalid={errors.text ? true : undefined}
            aria-describedby={errors.text ? `${formId}-text-error` : undefined}
          />
          {errors.text && <span id={`${formId}-text-error`} role="alert" className="text-xs text-red-500 px-1 font-medium">{errors.text}</span>}
        </div>
      )

    case 'wifi':
      return (
        <div className="flex flex-col gap-4">
          <Input
            label="Network Name (SSID)"
            name="ssid"
            value={metadata.ssid || ''}
            onChange={handleInputChange}
            placeholder="HomeNetwork"
            error={errors.ssid}
            required
            autoFocus
          />
          <Input
            label="Password"
            name="password"
            type="text"
            value={metadata.password || ''}
            onChange={handleInputChange}
            placeholder="••••••••"
            disabled={metadata.encryption === 'nopass'}
          />
          <Select
            label="Security Type"
            name="encryption"
            value={metadata.encryption || 'WPA'}
            onChange={handleInputChange}
            options={[
              { value: 'WPA', label: 'WPA/WPA2' },
              { value: 'WEP', label: 'WEP' },
              { value: 'nopass', label: 'Unsecured (None)' },
            ]}
          />
          <Checkbox
            label="Hidden Network"
            name="hidden"
            checked={metadata.hidden === 'true'}
            onChange={handleCheckboxChange}
          />
        </div>
      )

    case 'email':
      return (
        <div className="flex flex-col gap-4">
          <Input
            label="Email Address"
            name="email"
            type="email"
            value={metadata.email || ''}
            onChange={handleInputChange}
            placeholder="hello@example.com"
            error={errors.email}
            required
            autoFocus
          />
          <Input
            label="Subject"
            name="subject"
            value={metadata.subject || ''}
            onChange={handleInputChange}
            placeholder="Feedback"
          />
          <div className="flex flex-col gap-1.5 w-full">
            <label htmlFor={`${formId}-body`} className="text-xs font-semibold text-brand-lightText/60 px-1 uppercase tracking-wider">
              Email Body
            </label>
            <textarea
              id={`${formId}-body`}
              name="body"
              value={metadata.body || ''}
              onChange={handleInputChange}
              placeholder="Hi QRFolio team, ..."
              className="glass-input min-h-[80px] w-full resize-y"
            />
          </div>
        </div>
      )

    case 'phone':
      return (
        <div className="flex flex-col gap-4">
          <Input
            label="Phone Number"
            name="phone"
            type="tel"
            value={metadata.phone || ''}
            onChange={handleInputChange}
            placeholder="+1 234 567 8900"
            error={errors.phone}
            required
            autoFocus
          />
        </div>
      )

    case 'sms':
      return (
        <div className="flex flex-col gap-4">
          <Input
            label="Phone Number"
            name="phone"
            type="tel"
            value={metadata.phone || ''}
            onChange={handleInputChange}
            placeholder="+1 234 567 8900"
            error={errors.phone}
            required
            autoFocus
          />
          <div className="flex flex-col gap-1.5 w-full">
            <label htmlFor={`${formId}-message`} className="text-xs font-semibold text-brand-lightText/60 px-1 uppercase tracking-wider">
              Message Text
            </label>
            <textarea
              id={`${formId}-message`}
              name="message"
              value={metadata.message || ''}
              onChange={handleInputChange}
              placeholder="Send me a message..."
              className="glass-input min-h-[80px] w-full resize-y"
            />
          </div>
        </div>
      )

    case 'contact':
      return (
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First Name"
            name="firstName"
            value={metadata.firstName || ''}
            onChange={handleInputChange}
            placeholder="John"
            error={errors.firstName || errors.lastName}
          />
          <Input
            label="Last Name"
            name="lastName"
            value={metadata.lastName || ''}
            onChange={handleInputChange}
            placeholder="Doe"
            error={errors.lastName}
          />
          <div className="col-span-2">
            <Input
              label="Company"
              name="company"
              value={metadata.company || ''}
              onChange={handleInputChange}
              placeholder="Acme Corp"
            />
          </div>
          <div className="col-span-2">
            <Input
              label="Phone Number"
              name="phone"
              type="tel"
              value={metadata.phone || ''}
              onChange={handleInputChange}
              placeholder="+1 234 567 8900"
            />
          </div>
          <div className="col-span-2">
            <Input
              label="Email"
              name="email"
              type="email"
              value={metadata.email || ''}
              onChange={handleInputChange}
              placeholder="john@example.com"
            />
          </div>
          <div className="col-span-2">
            <Input
              label="Address"
              name="address"
              value={metadata.address || ''}
              onChange={handleInputChange}
              placeholder="123 Main St, New York"
            />
          </div>
          <div className="col-span-2">
            <Input
              label="Website"
              name="url"
              value={metadata.url || ''}
              onChange={handleInputChange}
              placeholder="https://example.com"
            />
          </div>
        </div>
      )

    case 'location':
      return (
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Latitude"
            name="latitude"
            value={metadata.latitude || ''}
            onChange={handleInputChange}
            placeholder="37.7749"
            error={errors.latitude}
            required
          />
          <Input
            label="Longitude"
            name="longitude"
            value={metadata.longitude || ''}
            onChange={handleInputChange}
            placeholder="-122.4194"
            error={errors.longitude}
            required
          />
        </div>
      )

    case 'calendar':
      return (
        <div className="flex flex-col gap-4">
          <Input
            label="Event Title"
            name="title"
            value={metadata.title || ''}
            onChange={handleInputChange}
            placeholder="Meeting with Team"
            error={errors.title}
            required
          />
          <Input
            label="Location"
            name="location"
            value={metadata.location || ''}
            onChange={handleInputChange}
            placeholder="Office Conference Room"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date & Time"
              name="start"
              type="datetime-local"
              value={metadata.start || ''}
              onChange={handleInputChange}
              error={errors.dateRange}
            />
            <Input
              label="End Date & Time"
              name="end"
              type="datetime-local"
              value={metadata.end || ''}
              onChange={handleInputChange}
              error={errors.dateRange}
            />
          </div>
          <div className="flex flex-col gap-1.5 w-full">
            <label htmlFor={`${formId}-description`} className="text-xs font-semibold text-brand-lightText/60 px-1 uppercase tracking-wider">
              Event Description
            </label>
            <textarea
              id={`${formId}-description`}
              name="description"
              value={metadata.description || ''}
              onChange={handleInputChange}
              placeholder="Discuss Q3 goals and milestones..."
              className="glass-input min-h-[80px] w-full resize-y"
            />
          </div>
        </div>
      )

    case 'crypto':
      return (
        <div className="flex flex-col gap-4">
          <Select
            label="Cryptocurrency"
            name="coin"
            value={getCryptoCurrency(metadata.coin)?.value || metadata.coin || 'BTC'}
            onChange={handleInputChange}
            options={CRYPTO_CURRENCIES.map(({ value, label }) => ({ value, label }))}
          />
          <Input
            label="Wallet Address"
            name="address"
            value={metadata.address || ''}
            onChange={handleInputChange}
            placeholder="1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
            error={errors.address}
            required
          />
          <Input
            label="Amount (Optional)"
            name="amount"
            type="number"
            step="any"
            value={metadata.amount || ''}
            onChange={handleInputChange}
            placeholder="0.1"
          />
        </div>
      )

    default:
      return null
  }
}
