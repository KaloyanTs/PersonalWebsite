<?php
// messages.php

// 1. Retrieve POST data
$name    = isset($_POST['name']) ? trim($_POST['name']) : '';
$email   = isset($_POST['email']) ? filter_var(trim($_POST['email']), FILTER_VALIDATE_EMAIL) : '';
$message = isset($_POST['message']) ? trim($_POST['message']) : '';

// 2. Basic validation: ensure required fields are present
if (empty($name) || empty($email) || empty($message)) {
    // Redirect back or display error
    header('Location: index.html?status=error');
    exit;
}

// 3. Prepare email headers and body
$to      = 'kaloyants25@gmail.com';
$subject = 'Personal Website Contact Form Submission';
$body    = "You have received a new message from your website contact form:\n\n";
$body   .= "Name: $name\n";
$body   .= "Email: $email\n\n";
$body   .= "Message:\n$message\n";

// $headers  = "From: $name <$email>\r\n";
// $headers .= "Reply-To: $email\r\n";

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
