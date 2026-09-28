import { useState } from "react";

export default function useForm(initialValues) {
  const [values, setValues] = useState(initialValues);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
  };

  const reset = (nextValues = initialValues) => setValues(nextValues);

  return { values, setValues, handleChange, reset };
}