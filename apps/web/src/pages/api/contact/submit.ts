import { NextApiRequest, NextApiResponse } from 'next';

// Email sending function (you'll need to configure your email service)
async function sendEmailToContact(data: any, type: 'newsletter' | 'membership') {
  const recipient = 'nestd@pm.me';
  
  if (type === 'newsletter') {
    const subject = 'New Newsletter Subscription';
    const body = `
New newsletter subscription:

Email: ${data.email}
Timestamp: ${new Date().toISOString()}
    `;
    
    // For now, we'll just log it - you can integrate with your email service
    console.log(`Sending email to ${recipient}:`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${body}`);
    
    // TODO: Integrate with your email service (SendGrid, Mailgun, etc.)
    // await emailService.send({
    //   to: recipient,
    //   subject,
    //   text: body
    // });
    
    return true;
  }
  
  if (type === 'membership') {
    const subject = 'New Membership Request';
    const body = `
New membership request received:

Personal Information:
- Name: ${data.firstName} ${data.lastName}
- Email: ${data.email}
- Phone: ${data.phone}
- Company: ${data.company || 'Not provided'}
- Website: ${data.website || 'Not provided'}

Experience Level: ${data.experience}

Interests:
${data.interests && data.interests.length > 0 ? data.interests.map((interest: string) => `- ${interest}`).join('\n') : '- None specified'}

Referral Source: ${data.referralSource || 'Not provided'}

Additional Information:
${data.additionalInfo || 'None provided'}

Agreed to PMA: ${data.agreeToPMA ? 'Yes' : 'No'}

Timestamp: ${new Date().toISOString()}
    `;
    
    console.log(`Sending email to ${recipient}:`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${body}`);
    
    // TODO: Integrate with your email service
    // await emailService.send({
    //   to: recipient,
    //   subject,
    //   text: body
    // });
    
    return true;
  }
  
  return false;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { type, data } = req.body;

    if (!type || !data) {
      return res.status(400).json({ 
        success: false, 
        error: 'Type and data are required' 
      });
    }

    if (type === 'newsletter') {
      if (!data.email) {
        return res.status(400).json({ 
          success: false, 
          error: 'Email is required for newsletter subscription' 
        });
      }

      await sendEmailToContact(data, 'newsletter');
      
      return res.status(200).json({ 
        success: true, 
        message: 'Thank you! You\'ve been subscribed to our newsletter.' 
      });
    }

    if (type === 'membership') {
      const requiredFields = ['firstName', 'lastName', 'email'];
      const missingFields = requiredFields.filter(field => !data[field]);
      
      if (missingFields.length > 0) {
        return res.status(400).json({ 
          success: false, 
          error: `Missing required fields: ${missingFields.join(', ')}` 
        });
      }

      await sendEmailToContact(data, 'membership');
      
      return res.status(200).json({ 
        success: true, 
        message: 'Thank you for your membership request! We\'ll review your application and contact you within 48 hours.' 
      });
    }

    return res.status(400).json({ 
      success: false, 
      error: 'Invalid submission type' 
    });

  } catch (error) {
    console.error('Contact submission error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
}
