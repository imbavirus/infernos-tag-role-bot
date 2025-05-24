/**
 * @file page.tsx
 * @description Support page component with contact form
 * @module app/support/page
 */

'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

/**
 * Form data interface for the support contact form
 * @interface FormData
 */
interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

/**
 * Support page component that renders a contact form
 * @returns {JSX.Element} The support page with contact form
 */
export default function SupportPage() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEmailEnabled = process.env.NEXT_PUBLIC_ENABLE_EMAIL === 'true';

  if (!isEmailEnabled) {
    return (
      <div className="h-[calc(100vh-65px)] bg-dark">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-6">Email Support Disabled</h1>
            <p className="text-gray-400 mb-8">
              Email support is currently disabled. Please contact us through our Discord server for assistance.
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 bg-lime hover:bg-lime-light text-white font-medium rounded-lg transition-colors"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Handles form submission and sends data to the API
   * @param {React.FormEvent} e - The form submission event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      toast.success('Message sent successfully!');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handles input changes in the form
   * @param {React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>} e - The input change event
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="h-[calc(100vh-65px)] bg-dark">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center">Contact Support</h1>
          <div className="bg-dark-lighter rounded-xl p-8 border border-lime/20">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-dark-lighter border border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-lime/40 focus:border-lime/40 text-white"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-dark-lighter border border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-lime/40 focus:border-lime/40 text-white"
                />
              </div>
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  required
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-dark-lighter border border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-lime/40 focus:border-lime/40 text-white"
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={6}
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-dark-lighter border border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-lime/40 focus:border-lime/40 text-white resize-none"
                ></textarea>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-6 py-3 bg-lime hover:bg-lime-light text-white font-medium rounded-lg transition-colors"
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 