/**
 * @file page.tsx
 * @description Support page component with contact form
 * @module app/support/page
 */

'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';

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
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Support</h1>
          <p className="text-gray-400">Have a question or need help? Send us a message!</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-dark-lighter p-8 rounded-xl">
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
              className="w-full px-4 py-2 bg-dark border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-lime/40 focus:border-transparent"
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
              className="w-full px-4 py-2 bg-dark border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-lime/40 focus:border-transparent"
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
              className="w-full px-4 py-2 bg-dark border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-lime/40 focus:border-transparent"
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
              className="w-full px-4 py-2 bg-dark border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-lime/40 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-lime hover:bg-lime/90 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      </div>
    </div>
  );
} 