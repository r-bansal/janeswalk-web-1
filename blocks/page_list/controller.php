<?php 
defined('C5_EXECUTE') or die("Access Denied.");
class PageListBlockController extends Concrete5_Controller_Block_PageList {
  public function getPageList() {
    Loader::model('page_list');
    $db = Loader::db();
    $bID = $this->bID;
    if ($this->bID) {
      $q = "select num, cParentID, cThis, orderBy, ctID, displayAliases, rss from btPageList where bID = '$bID'";
      $r = $db->query($q);
      if ($r) {
        $row = $r->fetchRow();
      }
    } else {
      $row['num'] = $this->num;
      $row['cParentID'] = $this->cParentID;
      $row['cThis'] = $this->cThis;
      $row['orderBy'] = $this->orderBy;
      $row['ctID'] = $this->ctID;
      $row['rss'] = $this->rss;
      $row['displayAliases'] = $this->displayAliases;
    }


    $pl = new PageList();
    $pl->setNameSpace('b' . $this->bID);

    $cArray = array();

    switch($row['orderBy']) {
    case 'display_asc':
      $pl->sortByDisplayOrder();
      break;
    case 'display_desc':
      $pl->sortByDisplayOrderDescending();
      break;
    case 'chrono_asc':
      $pl->sortByPublicDate();
      break;
    case 'alpha_asc':
      $pl->sortByName();
      break;
    case 'alpha_desc':
      $pl->sortByNameDescending();
      break;
    case 'random':
      $pl->sortBy('RAND()');
      break;
    default:
      $pl->sortByPublicDateDescending();
      break;
    }

    $num = (int) $row['num'];

    $pl->setItemsPerPage($num);			

    $c = Page::getCurrentPage();
    if (is_object($c)) {
      $this->cID = $c->getCollectionID();
    }

    Loader::model('attribute/categories/collection');
    if ($this->displayFeaturedOnly == 1) {
      $cak = CollectionAttributeKey::getByHandle('is_featured');
      if (is_object($cak)) {
        $pl->filterByIsFeatured(1);
      }
    }
    if (!$row['displayAliases']) {
      $pl->filterByIsAlias(0);
    }
    $pl->filter('cvName', '', '!=');			

    if ($row['ctID']) {
      $pl->filterByCollectionTypeID($row['ctID']);
    }

    $columns = $db->MetaColumns(CollectionAttributeKey::getIndexedSearchTable());
    if (isset($columns['AK_EXCLUDE_PAGE_LIST'])) {
      $pl->filter(false, '(ak_exclude_page_list = 0 or ak_exclude_page_list is null)');
    }

    if ( intval($row['cParentID']) != 0) {
      $cParentID = ($row['cThis']) ? $this->cID : $row['cParentID'];
      if ($this->includeAllDescendents) {
        $pl->filterByPath(Page::getByID($cParentID)->getCollectionPath());
      } else {
        $pl->filterByParentID($cParentID);
      }
    }
    return $pl;
  }

  public function view() {
    parent::view();
    $this->set('th', Loader::helper('theme'));
    $this->set('im', Loader::helper('image'));
    $this->set('u', new User());
    $this->set('rssUrl', $showRss ? $controller->getRssUrl($b) : '');
    $this->set('show', $_REQUEST['show']);
  }

  /* getCardData()
   * Loads models needed for a walk card in the view
   * @returns: array
   * ex. from view: extract($controller->getCardData());
   */
  public function getCardData($page) {
    $cardData['leaders'] = implode(
      ', ',
      array_map(
        function($mem) {
          if($mem['role'] === 'walk-leader' || $mem['type'] === 'leader') {
            return "{$mem['name-first']} {$mem['name-last']}";
          }
        },
        json_decode($page->getAttribute('team'),true)
      )
    );
    // Wards
    $cardData['wards'] = (array) $page->getAttribute('walk_wards');

    // Themes
    $themes = array();
    foreach($page->getAttribute('theme') as $theme) {
      array_push($themes, $this->get('th')->getName($theme));
    }
    $cardData['themes'] = json_encode($themes);

    // Accessibilities
    $accessibilities = array();
    foreach($page->getAttribute('accessible') as $accessibility) {
      array_push($accessibilities, $this->get('th')->getName($accessibility));
    }
    $cardData['accessibilities'] = json_encode($accessibilities);

    // Initiatives
    $initiatives = array();
    $initiativeObjects = $page->getAttribute('walk_initiatives');
    if ($initiativeObjects !== false) {
      foreach ($initiativeObjects->getOptions() as $initiative) {
        $val = $initiative->value;
        $initiatives[] = $val;
      }
    }
    sort($initiatives);
    $cardData['initiatives'] = json_encode($initiatives);

    // Dates
    $dates = array();
    $scheduled = $page->getAttribute('scheduled');
    $slots = (array) $scheduled['slots']; 
    if(isset($slots[0]['date'])) {
      $dates = array($slots[0]['date']);
    }
    $cardData['dates'] = json_encode($dates);
    if($scheduled['open']) {
      $cardData['when'] = 'Open schedule';
    } else if(isset($slots[0]['date'])) {
      $cardData['when'] = "{$slots[0]['time']}, {$slots[0]['date']}";
    } else {
      $cardData['when'] = null;
    }

    // Thumbnail
    $thumb = $page->getAttribute('thumbnail');
    if($thumb) $cardData['cardBg'] = $im->getThumbnail($thumb,380,720)->src;
    $cardData['placeholder'] = 'placeholder' . ord($page->getCollectionName()) % 3;
    return $cardData;
  }

}