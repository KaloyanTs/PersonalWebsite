<?php
// messages.php

// 1. Retrieve POST data
$name    = isset($_POST['name']) ? trim($_POST['name']) : '';
$email   = isset($_POST['email']) ? filter_var(trim($_POST['email']), FILTER_VALIDATE_EMAIL) : '';
$message = isset($_POST['message']) ? trim($_POST['message']) : '';

// 2. Basic validation: ensure required fields are present
// Basic presence validation
if (empty($name) || empty($email) || empty($message)) {
    // Redirect back or display error
    header('Location: index.html?status=error');
    exit;
}

// 3. Prepare email headers and body
$to      = 'kaloyants25@gmail.com';
$subject = 'Personal Website Contact Form Submission';
// Prepare email body
$body    = "You have received a new message from your website contact form:\n\n";
$body   .= "Name: $name\n";
$body   .= "Email: $email\n\n";
$body   .= "Message:\n$message\n";

// Prevent header injection by stripping CR/LF from user-controlled header fields
$safe_name = preg_replace('/[\r\n]+/', ' ', $name);
$safe_email = preg_replace('/[\r\n]+/', '', $email);

// Build headers
$headers  = "From: " . $safe_name . " <" . $safe_email . ">\r\n";
$headers .= "Reply-To: " . $safe_email . "\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

// 4. Send email
if (mail($to, $subject, $body, $headers)) {
    // Redirect or show a thank-you message
    header('Location: index.html?status=success');
    exit;
} else {
    // Redirect or show an error message
    header('Location: index.html?status=error');
    exit;
}
?>
