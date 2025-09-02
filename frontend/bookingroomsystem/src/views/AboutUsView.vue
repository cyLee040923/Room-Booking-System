<template>
  <div class="about-us">
    <h1>KUJU</h1>
    <p>
      Empowering Life's Defining Moments
    </p>
    <div class="content">
      <div class="text-content">
        <h2>Our Philosophy</h2>
        <p>
          In Ancient Greece, there were two different concepts of time: “Chronos” is the quantitative measure of time, i.e., the time we see on a clock; and “Kairos” is the qualitative concept of time – a time to be present, a defining moment, a time to take action – just like the ideal moment an archer shoots an arrow at his target.
        </p>
        <p>
          Technology should aim to improve the lives of its users, not simply by giving them more time and efficiency, but by empowering them to live their best lives in each opportune moment and share that with those they love. This is the value and essence we want to convey to our customers.
        </p>
      </div>
      <div class="image-container">
        <img
          class="company-image"
          src="@/images/AboutUs.jpg"
          alt="Company Image"
        />
      </div>
    </div>
    <div class="text-content">
      <h2>Contact Us</h2>
      <p>
        <strong>HK Headquarter</strong><br />
        Unit 219, 2/F,<br />
        16 Science Park West Avenue,<br />
        Shatin, New Territories,<br />
        Hong Kong
      </p>
      <p>
        <strong>TRONICO TECHNOLOGY CO. LTD.</strong><br />
        Phone: (852) 9667 7650<br />
        Email: <a href="mailto:kuju@tronico.com.hk">kuju@tronico.com.hk</a>
      </p>
    </div>
  </div>
</template>

<style scoped>
.about-us {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
}

.about-us h1 {
  font-size: 2.5em;
  margin-bottom: 20px;
  color: #333;
}

.about-us h2 {
  font-size: 1.8em;
  margin-bottom: 15px;
  color: #444;
}

.content {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 30px;
  margin-top: 20px;
}

.text-content {
  flex: 1;
  min-width: 300px;
  text-align: justify;
}

.text-content p {
  font-size: 1.2em;
  line-height: 1.8;
  color: #555;
  margin-bottom: 15px;
}

.text-content a {
  color: #007BFF;
  text-decoration: none;
}

.text-content a:hover {
  text-decoration: underline;
}

.image-container {
  flex: 1;
  min-width: 300px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.company-image {
  width: 100%;
  max-width: 500px;
  height: auto;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}
</style>
