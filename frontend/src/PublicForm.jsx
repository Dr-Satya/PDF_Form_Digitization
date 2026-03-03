import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import DynamicForm from './DynamicForm';

const PublicForm = () => {
  const { slug } = useParams();
  const [schema, setSchema] = useState(null);
  const [formId, setFormId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:8000/api/public/forms/${slug}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setSchema(data.schema);
          setFormId(data.form_id);
        }
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load form');
        setLoading(false);
      });
  }, [slug]);

  const handleSubmit = (filledData, email) => {
    fetch(`http://localhost:8000/api/forms/${formId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filled_data: filledData, email: email })
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          alert('Submission failed: ' + data.error);
        } else {
          alert('Form submitted successfully!');
        }
      })
      .catch(() => alert('Submission failed'));
  };

  if (loading) return <div>Loading form...</div>;
  if (error) return <div>Error: {error}</div>;
  return <DynamicForm schema={schema} onSubmit={handleSubmit} />;
};

export default PublicForm;
