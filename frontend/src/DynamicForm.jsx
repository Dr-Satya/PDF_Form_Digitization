import React, { useState } from 'react';

const DynamicForm = ({ schema, onSubmit }) => {
  const [filledData, setFilledData] = useState([]);

  const handleChange = (index, value) => {
    const newData = [...filledData];
    newData[index] = { label: getLabelAtIndex(index), value };
    setFilledData(newData);
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
    onSubmit({ filled_data: filledData });
  };

  let fieldIndex = 0;

  return (
    <div className="form-container">
      <h2>Generated Form</h2>
      <form onSubmit={handleSubmit} className="dynamic-form">
        {schema.sections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="form-section">
            <h3>{section.title}</h3>
            {section.fields.map((field) => (
              <div key={fieldIndex} className="form-field">
                <label htmlFor={`field-${fieldIndex}`}>{field.label}:</label>
                <input
                  id={`field-${fieldIndex}`}
                  type={field.type}
                  value={filledData[fieldIndex]?.value || ''}
                  onChange={(e) => handleChange(fieldIndex, e.target.value)}
                  required={field.required}
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                  className="form-input"
                />
                {fieldIndex++}
              </div>
            ))}
          </div>
        ))}
        <button type="submit" className="submit-button">Submit Form</button>
      </form>
    </div>
  );
};

export default DynamicForm;
