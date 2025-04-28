'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

type FormState = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

type FormErrors = {
  [key in keyof FormState]?: string;
};

export default function ContactPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormState>({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user types
    if (errors[name as keyof FormState]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }
    
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      // Submit form data to API
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit form');
      }
      
      // Reset form on success
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
      
      // Redirect to thank you page
      router.push('/contact/thank-you');
      
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitError('There was a problem submitting your inquiry. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-theme-neutral-800 mb-4">
              Contact Us
            </h1>
            <p className="text-theme-neutral-600 text-lg">
              Have questions about our courses or need assistance? Reach out to us and we'll be happy to help.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 border border-theme-neutral-200">
            {submitSuccess ? (
              <div className="text-center py-8">
                <div className="mb-6 text-theme-primary-DEFAULT">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-theme-neutral-800 mb-2">Thank You!</h2>
                <p className="text-theme-neutral-600 mb-6">
                  Your message has been received. We'll get back to you as soon as possible.
                </p>
                <button 
                  onClick={() => setSubmitSuccess(false)}
                  className="px-6 py-3 bg-theme-primary-DEFAULT text-white rounded-lg hover:bg-theme-primary-dark transition-colors"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {submitError && (
                  <div className="p-4 bg-red-50 text-red-600 rounded-lg mb-6">
                    {submitError}
                  </div>
                )}
                
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-theme-neutral-800 mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-lg border ${errors.name ? 'border-red-500' : 'border-theme-neutral-200'} focus:outline-none focus:ring-2 focus:ring-theme-primary-light`}
                    placeholder="John Doe"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-theme-neutral-800 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-lg border ${errors.email ? 'border-red-500' : 'border-theme-neutral-200'} focus:outline-none focus:ring-2 focus:ring-theme-primary-light`}
                    placeholder="you@example.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-theme-neutral-800 mb-1">
                    Subject *
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-lg border ${errors.subject ? 'border-red-500' : 'border-theme-neutral-200'} focus:outline-none focus:ring-2 focus:ring-theme-primary-light`}
                  >
                    <option value="">Select a subject</option>
                    <option value="Course Inquiry">Course Inquiry</option>
                    <option value="Enrollment Question">Enrollment Question</option>
                    <option value="Technical Support">Technical Support</option>
                    <option value="Billing Issue">Billing Issue</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.subject && (
                    <p className="mt-1 text-sm text-red-600">{errors.subject}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-theme-neutral-800 mb-1">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    value={formData.message}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-lg border ${errors.message ? 'border-red-500' : 'border-theme-neutral-200'} focus:outline-none focus:ring-2 focus:ring-theme-primary-light`}
                    placeholder="How can we help you?"
                  ></textarea>
                  {errors.message && (
                    <p className="mt-1 text-sm text-red-600">{errors.message}</p>
                  )}
                </div>
                
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full px-6 py-3 bg-theme-primary-DEFAULT !bg-[#4F46E5] text-white rounded-lg border-2 border-theme-primary-DEFAULT hover:bg-theme-primary-dark transition-colors disabled:bg-theme-neutral-400 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Submitting...' : 'Send Message'}
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="mt-16 grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-lg border border-theme-neutral-200 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-theme-primary-light/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-theme-primary-DEFAULT" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-theme-neutral-800 mb-2">Phone Support</h3>
              <p className="text-theme-neutral-600">
                Need immediate assistance? Call our support team.
              </p>
              <a
                href="tel:+18005887039"
                className="block mt-4 text-theme-primary-DEFAULT hover:underline"
              >
                (800) 588-7039
              </a>
            </div>
            
            <div className="text-center p-6 rounded-lg border border-theme-neutral-200 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-theme-primary-light/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-theme-primary-DEFAULT" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-theme-neutral-800 mb-2">Email Us</h3>
              <p className="text-theme-neutral-600">
                Send us an email and we'll respond within 24 hours.
              </p>
              <a
                href="mailto:contact@bhfe.com"
                className="block mt-4 text-theme-primary-DEFAULT hover:underline break-all"
              >
                contact@bhfe.com
              </a>
            </div>
            
            <div className="text-center p-6 rounded-lg border border-theme-neutral-200 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-theme-primary-light/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-theme-primary-DEFAULT" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-theme-neutral-800 mb-2">Office Hours</h3>
              <p className="text-theme-neutral-600">
                We're available Monday-Friday
              </p>
              <p className="block mt-4 text-theme-neutral-800 font-medium">
                9:00 AM - 5:00 PM EST
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 