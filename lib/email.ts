import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@ris-foods.com';

interface EmailOptions {
    subject: string;
    html: string;
    replyTo?: string;
}

export async function sendEmail({ subject, html, replyTo }: EmailOptions) {
    try {
        const { data, error } = await resend.emails.send({
            from: 'RIS Foods <onboarding@resend.dev>',
            to: [ADMIN_EMAIL],
            subject,
            html,
            replyTo,
        });

        if (error) {
            console.error('Resend email error:', error);
            return { success: false, error };
        }

        return { success: true, data };
    } catch (err) {
        console.error('Email sending failed:', err);
        return { success: false, error: err };
    }
}

export function createCustomerFeedbackEmail(data: {
    name: string;
    email: string;
    mobile: string;
    feedback: string;
    rating: number;
}) {
    const stars = '⭐'.repeat(data.rating);

    return {
        subject: `New Customer Feedback - ${data.rating} Stars`,
        html: `
      <h2>New Customer Feedback Received</h2>
      <p><strong>Rating:</strong> ${stars} (${data.rating}/5)</p>
      <hr />
      <p><strong>Name:</strong> ${data.name}</p>
      <p><strong>Email:</strong> <a href="mailto:${data.email}">${data.email}</a></p>
      <p><strong>Mobile:</strong> ${data.mobile}</p>
      <p><strong>Feedback:</strong></p>
      <p>${data.feedback}</p>
      <hr />
      <p style="color: #666; font-size: 12px;">Submitted via RIS Foods Customer Feedback Form</p>
    `,
        replyTo: data.email,
    };
}

export function createGeneralEnquiryEmail(data: {
    full_name: string;
    email: string;
    mobile: string;
    message: string;
}) {
    return {
        subject: `New General Enquiry from ${data.full_name}`,
        html: `
      <h2>New General Enquiry Received</h2>
      <hr />
      <p><strong>Name:</strong> ${data.full_name}</p>
      <p><strong>Email:</strong> <a href="mailto:${data.email}">${data.email}</a></p>
      <p><strong>Mobile:</strong> ${data.mobile}</p>
      <p><strong>Message:</strong></p>
      <p>${data.message}</p>
      <hr />
      <p style="color: #666; font-size: 12px;">Submitted via RIS Foods General Enquiry Form</p>
    `,
        replyTo: data.email,
    };
}

export function createDistributorEnquiryEmail(data: {
    name: string;
    firm_name: string;
    address: string;
    telephone?: string;
    mobile: string;
    email: string;
    type?: string;
    year_of_establishment?: string;
    turnover?: string;
    warehouse_area?: string;
    comments?: string;
}) {
    return {
        subject: `New Distributor Enquiry - ${data.firm_name}`,
        html: `
      <h2>New Distributor Enquiry Received</h2>
      <hr />
      <h3>Contact Information</h3>
      <p><strong>Name:</strong> ${data.name}</p>
      <p><strong>Company:</strong> ${data.firm_name}</p>
      <p><strong>Email:</strong> <a href="mailto:${data.email}">${data.email}</a></p>
      <p><strong>Mobile:</strong> ${data.mobile}</p>
      ${data.telephone ? `<p><strong>Telephone:</strong> ${data.telephone}</p>` : ''}
      <p><strong>Address:</strong> ${data.address}</p>
      
      <h3>Business Details</h3>
      ${data.type ? `<p><strong>Firm Type:</strong> ${data.type}</p>` : ''}
      ${data.year_of_establishment ? `<p><strong>Year of Establishment:</strong> ${data.year_of_establishment}</p>` : ''}
      ${data.turnover ? `<p><strong>Turnover (Last FY):</strong> ${data.turnover}</p>` : ''}
      ${data.warehouse_area ? `<p><strong>Warehouse Area:</strong> ${data.warehouse_area} sq.ft.</p>` : ''}
      
      ${data.comments ? `
        <h3>Additional Comments</h3>
        <p>${data.comments}</p>
      ` : ''}
      
      <hr />
      <p style="color: #666; font-size: 12px;">Submitted via RIS Foods Distributor Enquiry Form</p>
    `,
        replyTo: data.email,
    };
}

