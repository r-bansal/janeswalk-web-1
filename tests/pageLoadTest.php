<?php
class pageLoadTest extends PHPUnit_Framework_TestCase
{

  public function testHomePageLoads()
    {
          $this->assertRegExp('/All rights reserved./', file_get_contents('http://localhost/janes-walk/'));

    }

}
?>
