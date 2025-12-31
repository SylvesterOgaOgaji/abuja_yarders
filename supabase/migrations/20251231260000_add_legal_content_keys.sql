-- Add comprehensive legal content keys to dashboard_content
-- Content drafted to align with GDPR, NDPR 2019, and general data protection best practices.
-- Formatting cleaned to remove Markdown syntax types and emojis as requested.

INSERT INTO public.dashboard_content (key, value, description)
VALUES 
    ('legal_terms', 'TERMS AND CONDITIONS

Last Updated: January 01, 2026

1. INTRODUCTION
Welcome to the Abuja Yarders Mobile Application ("App"). By downloading, accessing, or using this App, you agree to be bound by these Terms and Conditions ("Terms"). If you do not agree to these Terms, please do not use the App.

2. USER ACCOUNTS
To access certain features, you must create an account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete. You are responsible for safeguarding your password and for all activities that occur under your account.

3. COMMUNITY CONDUCT
We are committed to maintaining a safe and respectful community. Users must not:
- Post content that is illegal, harmful, threatening, abusive, harassing, defamatory, or hateful.
- Impersonate any person or entity.
- Share false or misleading information.
- Violate the privacy or intellectual property rights of others.

We reserve the right to suspend or terminate accounts that violate these guidelines.

4. INTELLECTUAL PROPERTY
All content included on the App, such as text, graphics, logos, images, and software, is the property of JV ImpactVR Initiative Ltd/Gte or its content suppliers and is protected by international copyright laws.

5. DISCLAIMER OF WARRANTIES
The App is provided on an "AS IS" and "AS AVAILABLE" basis. We make no warranties, expressed or implied, regarding the operation of the App or the information, content, or materials included therein.

6. LIMITATION OF LIABILITY
In no event shall JV ImpactVR Initiative Ltd/Gte be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the App.

7. GOVERNING LAW
These Terms shall be governed by and construed in accordance with the laws of the Federal Republic of Nigeria.

8. CHANGES TO TERMS
We reserve the right to modify these Terms at any time. Your continued use of the App following any changes signifies your acceptance of the new Terms.

9. CONTACT US
For any questions regarding these Terms, please contact us at:
JV ImpactVR Initiative Ltd/Gte
Flat H, Block 7 Plot 045, Cluster 3 River Park Lugbe Airport Road, 
Abuja, Nigeria 900107
Email: jvimpactvrinitiativeltdgte@gmail.com', 'Full text for Terms and Conditions page'),

    ('legal_privacy', 'PRIVACY POLICY

Last Updated: January 01, 2026

1. PREAMBLE AND SCOPE
JV ImpactVR Initiative Ltd/Gte ("we," "us," or "our") respects your privacy and is committed to protecting your personal data. This Privacy Policy governs the manner in which we collect, use, maintain, and disclose information collected from users of the Abuja Yarders Mobile Application. This policy is drafted in strict compliance with the Nigeria Data Protection Regulation (NDPR) 2019, the General Data Protection Regulation (GDPR), and other applicable international privacy laws.

2. DATA CONTROLLER
For the purposes of the NDPR and GDPR, JV ImpactVR Initiative Ltd/Gte acts as the Data Controller in respect of the personal data processed through this App. We are responsible for determining the purposes and means of processing your personal data.
Physical Address: Flat H, Block 7 Plot 045, Cluster 3 River Park Lugbe Airport Road, Abuja, Nigeria 900107.

3. LAWFUL BASIS FOR PROCESSING
We process your personal data based on the following lawful grounds:
- Consent: You have given clear consent for us to process your personal data for specific purposes.
- Contractual Obligation: Processing is necessary for the performance of a contract to which you are a party (e.g., providing App services).
- Legal Obligation: Processing is necessary for compliance with a legal obligation to which we are subject.
- Vital Interests: Processing is necessary to protect someone''s life.
- Public Task: Processing is necessary to perform a task in the public interest.
- Legitimate Interests: Processing is necessary for our legitimate interests or the legitimate interests of a third party.

4. INFORMATION WE COLLECT
We may collect and process the following categories of data:
- Personal Identification Information: Name, email address, phone number, residential address, and profile photograph.
- Technical Data: Internet Protocol (IP) address, device type, operating system, and usage data.
- User Content: Messages, pledges, and other content you generate within the App.

5. PURPOSE OF DATA COLLECTION
We utilize the collected data to:
- Establish and authenticate user identity.
- Facilitate community interaction and manage welfare pledges.
- Improve our App functionality and user experience.
- Comply with regulatory and legal requirements.
- Detect and prevent fraud or security breaches.

6. DATA RIGHTS OF THE SUBJECT
Under the NDPR and GDPR, you have the following rights regarding your personal data:
- Right to Access: You represent the right to request copies of your personal data.
- Right to Rectification: You have the right to request correction of inaccurate data.
- Right to Erasure: You have the right to request deletion of your personal data regarding the "Right to be Forgotten".
- Right to Restrict Processing: You have the right to restrict the processing of your data under certain conditions.
- Right to Data Portability: You have the right to request transfer of your data to another organization or directly to you.
- Right to Withdraw Consent: Where processing is based on consent, you have the right to withdraw consent at any time.

To exercise these rights, please contact our Data Protection Officer at jvimpactvrinitiativeltdgte@gmail.com.

7. DATA SECURITY AND RETENTION
We implement robust technical and organizational measures to ensure the security of your data, including encryption and secure server storage. We retain personal data only for as long as necessary to fulfill the purposes for which it was collected, or as required by law.

8. INTERNATIONAL DATA TRANSFERS
Your data may be processed in Nigeria and other locations where our service providers maintain facilities. We ensure that such transfers comply with the data adequacy requirements of the NDPR and GDPR.

9. CHILDREN''S PRIVACY
We do not knowingly collect personal data from children under the age of 13. If we become aware that we have collected such data without parental consent, we will delete it immediately.

10. CHANGES TO THIS POLICY
We reserve the right to update this Privacy Policy at any time. We will notify you of any changes by updating the date at the top of this policy.

11. CONTACT US
If you have questions about this Privacy Policy or our treatment of your personal data, please contact us at:
JV ImpactVR Initiative Ltd/Gte
Flat H, Block 7 Plot 045, Cluster 3 River Park Lugbe Airport Road, 
Abuja, Nigeria 900107
Email: jvimpactvrinitiativeltdgte@gmail.com
Phone: +234 805 796 1025', 'Full text for Privacy Policy page'),

    ('legal_contact', 'CONTACT US

We are here to help! If you have any questions, concerns, or feedback, please reach out to us using the details below.

GENERAL INQUIRIES
Email: jvimpactvrinitiativeltdgte@gmail.com
Phone: +234 805 796 1025
WhatsApp: +234 805 796 1025

TECHNICAL SUPPORT
Email: slyokoh@gmail.com

PHYSICAL ADDRESS
JV ImpactVR Initiative Ltd/Gte
Flat H, Block 7 Plot 045, Cluster 3 River Park Lugbe Airport Road,
Abuja, Nigeria 900107

SUPPORT HOURS
Monday - Friday: 9:00 AM - 5:00 PM (WAT)', 'Contact details displayed on Contact Us page')

ON CONFLICT (key) 
DO UPDATE SET value = EXCLUDED.value;
