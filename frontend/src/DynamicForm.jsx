import React, { useState } from 'react';
import Footer from './Footer'

const DynamicForm = ({ schema, onSubmit }) => {
  const [filledData, setFilledData] = useState([]);
  const [email, setEmail] = useState('');

  const handleChange = (index, value) => {
    const newData = [...filledData];
    newData[index] = { label: getLabelAtIndex(index), value };
    setFilledData(newData);
  };

  const handleEmailChange = (value) => {
    setEmail(value);
  };

  const getLabelAtIndex = (index) => {
    let currentIndex = 0;
    for (const section of schema.sections) {
      for (const field of section.fields) {
        if (currentIndex === index) return field.label;
        currentIndex++;
      }
    }
    return '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate email
    if (!email || !email.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }
    
    onSubmit(filledData, email);
  };

  let fieldIndex = 0;

  return (
    <div className="public-form">
      <div>
        <div className="card">
          <div className="card-header">
            <div className="brand-lockup" style={{ marginBottom: '0.75rem' }}>
              <img className="brand-logo" src="/Pragyanovation_Logo.jpg" alt="Pragyanovation" />
              <div className="brand-text">
                <h1>{schema?.name ? schema.name : 'Generated Form'}</h1>
                <p>Pragyanovation</p>
              </div>
            </div>
            {schema?.adminText ? <p>{schema.adminText}</p> : null}
          </div>
          <form onSubmit={handleSubmit} className="form-grid">
            <label className="form-group">
              <span>Email Address *</span>
              <input
                id="submitter-email"
                type="email"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                required
                placeholder="Enter your email address"
              />
            </label>
          
            {schema.sections.map((section, sectionIndex) => (
              <div key={sectionIndex} className="section-card">
                <h3 style={{ margin: 0 }}>{section.title}</h3>
                {section.fields.map((field) => (
                (() => {
                  const idx = fieldIndex;
                  fieldIndex += 1;
                  return (
                    <label key={idx} className="form-group" htmlFor={`field-${idx}`}>
                      <span>{field.label}{field.required ? ' *' : ''}</span>
                      <input
                        id={`field-${idx}`}
                        type={field.type}
                        value={filledData[idx]?.value || ''}
                        onChange={(e) => handleChange(idx, e.target.value)}
                        required={field.required}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                      />
                    </label>
                  );
                })()
              ))}
              </div>
            ))}

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">Submit Form</button>
            </div>
          </form>
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default DynamicForm;
