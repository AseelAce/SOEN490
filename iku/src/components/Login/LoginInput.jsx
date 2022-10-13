import React from 'react';

import '../../styles/Login.css';

const LoginInput = ({ handleInputChange, value, label, type, name, ariaLabel, count }) => {


    return(
        <>
            <label classNameName='login-label' htmlFor={name}>{label}</label>
            <input
                classNameName='login-input'
                value={value}
                onChange={event => handleInputChange(event, count)}
                type={type}
                name={name}
                aria-label={ariaLabel}
                required
            />
        </>
    )
}

export default LoginInput