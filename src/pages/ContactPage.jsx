import React, { useState, useRef } from "react";
import emailjs from "@emailjs/browser";
import "./ContactPage.css";

const ContactPage = () => {
  const formRef = useRef(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      // Initialize EmailJS on first submit
      emailjs.init({
        publicKey: "lZ6xEV2WH0V3cXVlL",
        limitRate: {
          id: "contact_form",
          throttle: 50
        }
      });

      // Send email
      const result = await emailjs.send(
        "service_dkj9h37",
        "template_5xk3n2j",
        {
          from_name: formData.name,
          from_email: formData.email,
          subject: formData.subject,
          message: formData.message,
          to_email: "grant.culbertson@example.com",
          reply_to: formData.email
        }
      );

      if (result.status === 200) {
        setStatus({
          type: "success",
          message: "Message sent successfully! I'll get back to you soon."
        });
        setFormData({ name: "", email: "", subject: "", message: "" });
        formRef.current?.reset();
        
        setTimeout(() => setStatus(null), 5000);
      }
    } catch (error) {
      console.error("Email error:", error);
      
      // Fallback: Open email client
      const mailtoLink = `mailto:grant.culbertson@example.com?subject=${encodeURIComponent(formData.subject)}&body=${encodeURIComponent(
        `Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`
      )}`;
      
      setStatus({
        type: "info",
        message: "Opening your email client to send the message..."
      });
      
      window.location.href = mailtoLink;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-page">
      <div className="contact-container">
        <div className="contact-header">
          <h1>Get in Touch</h1>
          <p>Have questions about biochemistry or this project? I'd love to hear from you!</p>
        </div>

        <div className="contact-content">
          <div className="contact-info">
            <h3>Contact Information</h3>
            <div className="info-item">
              <h4>Email</h4>
              <p>
                <a href="mailto:grantc24@vt.edu">grantc24</a>
              </p>
            </div>
            <div className="info-item">
              <h4>GitHub</h4>
              <p>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                  github.com
                </a>
              </p>
            </div>
            <div className="info-item">
              <h4>LinkedIn</h4>
              <p>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
                  linkedin.com
                </a>
              </p>
            </div>
            <div className="info-item">
              <h4>About This Project</h4>
              <p>
                BiochemReact is an interactive learning platform that combines 3D molecular 
                visualization with enzyme kinetics simulations. Perfect for students learning 
                biochemistry and molecular biology.
              </p>
            </div>
          </div>

          <form ref={formRef} onSubmit={handleSubmit} className="contact-form">
            <h3>Send a Message</h3>

            <div className="form-group">
              <label htmlFor="name">Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Your full name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="your.email@example.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="subject">Subject *</label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                placeholder="What is this about?"
              />
            </div>

            <div className="form-group">
              <label htmlFor="message">Message *</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows="6"
                placeholder="Tell me your thoughts or questions..."
              ></textarea>
            </div>

            {status && (
              <div className={`status-message ${status.type}`}>
                {status.message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="submit-btn"
            >
              {loading ? "Sending..." : "Send Message"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
