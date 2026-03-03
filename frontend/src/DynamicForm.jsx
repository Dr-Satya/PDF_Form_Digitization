import React, { useState } from 'react';

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
    <div className="form-container">
      <h2>{schema?.name ? schema.name : 'Generated Form'}</h2>
      {schema?.adminText && (
        <div className="admin-instructions" style={{ 
          backgroundColor: '#f8f9fa', 
          border: '1px solid #dee2e6', 
          borderRadius: '4px', 
          padding: '12px', 
          marginBottom: '20px',
          fontSize: '14px',
          color: '#495057'
        }}>
          <strong>Instructions:</strong> {schema.adminText}
        </div>
      )}
      <form onSubmit={handleSubmit} className="dynamic-form">
        {/* Mandatory Email Field */}
        <div className="form-field" style={{ 
          border: '2px solid #007bff', 
          borderRadius: '4px', 
          padding: '12px', 
          marginBottom: '20px',
          backgroundColor: '#f8f9fa'
        }}>
          <label htmlFor="submitter-email" style={{ fontWeight: 'bold', color: '#007bff' }}>
            Email Address <span style={{ color: 'red' }}>*</span>:
          </label>
          <input
            id="submitter-email"
            type="email"
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            required
            placeholder="Enter your email address"
            className="form-input"
            style={{ width: '100%', padding: '8px' }}
          />
          <small style={{ color: '#6c757d', fontSize: '12px' }}>
            This field is required for submission tracking
          </small>
        </div>
        
        {schema.sections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="form-section">
            <h3>{section.title}</h3>
            {section.fields.map((field) => (
              (() => {
                const idx = fieldIndex;
                fieldIndex += 1;
                return (
                  <div key={idx} className="form-field">
                    <label htmlFor={`field-${idx}`}>{field.label}:</label>
                    <input
                      id={`field-${idx}`}
                      type={field.type}
                      value={filledData[idx]?.value || ''}
                      onChange={(e) => handleChange(idx, e.target.value)}
                      required={field.required}
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                      className="form-input"
                    />
                  </div>
                );
              })()
            ))}
          </div>
        ))}
        <button type="submit" className="submit-button">Submit Form</button>
      </form>
    </div>
  );
};

export default DynamicForm;
